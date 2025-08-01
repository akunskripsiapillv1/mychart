# models_loader.py

from transformers import (
    AutoProcessor,
    LlavaForConditionalGeneration,
    BitsAndBytesConfig,
    VisionEncoderDecoderModel,
    DonutProcessor
)
from peft import PeftModel
from PIL import Image
import torch
import re
import os
from dotenv import load_dotenv
from config import CHARTINSTRUCT_BASE, CHARTINSTRUCT_ADAPTER, UNICHART_PATH

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# === Load ChartInstruct-LLaMA ===
def load_chartinstruct_model():
    processor = AutoProcessor.from_pretrained(CHARTINSTRUCT_BASE, token=HF_TOKEN)

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16
    )

    base_model = LlavaForConditionalGeneration.from_pretrained(
        CHARTINSTRUCT_BASE,
        torch_dtype=torch.float16,
        quantization_config=quant_config,
        token=HF_TOKEN
    )

    model = PeftModel.from_pretrained(base_model, CHARTINSTRUCT_ADAPTER)
    model.to("cuda")
    return model, processor


# === Load UniChart ===
def load_unichart_model():
    processor = DonutProcessor.from_pretrained(UNICHART_PATH)
    model = VisionEncoderDecoderModel.from_pretrained(UNICHART_PATH, token=HF_TOKEN)
    model.to("cuda")
    return model, processor


# === Helper Functions ===
def generate_chartinstruct(model, processor, image, prompt):
    inputs = processor(text=prompt, images=image, return_tensors="pt").to("cuda")
    if "pixel_values" in inputs:
        inputs["pixel_values"] = inputs["pixel_values"].to(torch.float16)

    prompt_len = inputs["input_ids"].shape[1]
    outputs = model.generate(**inputs, max_new_tokens=256)
    response = processor.decode(outputs[0][prompt_len:], skip_special_tokens=True).strip()
    return prune_sentence(response)


def generate_unichart(model, processor, image, prompt):
    # Preprocess image
    pixel_values = processor(image, return_tensors="pt").pixel_values.to("cuda")

    # Tokenize prompt
    decoder_input_ids = processor.tokenizer(prompt, add_special_tokens=False, return_tensors="pt").input_ids.to("cuda")

    # Generate
    outputs = model.generate(
        pixel_values=pixel_values,
        decoder_input_ids=decoder_input_ids,
        max_length=model.decoder.config.max_position_embeddings,
        early_stopping=True,
        pad_token_id=processor.tokenizer.pad_token_id,
        eos_token_id=processor.tokenizer.eos_token_id,
        use_cache=True,
        num_beams=4,
        bad_words_ids=[[processor.tokenizer.unk_token_id]],
        return_dict_in_generate=True,
    )

    sequence = processor.batch_decode(outputs.sequences)[0]
    sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
    answer = sequence.split("<s_answer>")[1].strip()
    return answer


def prune_sentence(text):
    """Prune teks agar hanya sampai titik/koma terakhir."""
    matches = list(re.finditer(r'\.(?!\d)', text))
    if matches:
        last_valid = matches[-1].start()
        return text[:last_valid+1].strip()
    last_comma = text.rfind(",")
    if last_comma != -1:
        return text[:last_comma].strip()
    return text.strip()