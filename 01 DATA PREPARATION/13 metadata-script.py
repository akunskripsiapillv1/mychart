import os
import pandas as pd

# === STATISTA ===
# Asumsikan file metadata Statista memiliki kolom: id, chartType
statista_metadata_file = "Statista Dataset/indo-version-clean/metadata_statista.csv"
statista_metadata = pd.read_csv(statista_metadata_file)

def read_text_file(folder, file_id):
    """Baca file teks dari folder dengan nama file {id}.txt"""
    file_path = os.path.join(folder, f"{file_id}.txt")
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

statista_rows = []
for _, row in statista_metadata.iterrows():
    print(f"Processing {row["id"]} ...")
    file_id = row["id"]  # misalnya, "997bb945-628d-4724-b370-b84de974a19f"
    chart_type = row["chartType"].lower()
    # # Mapping: column/bar => barchart, pie => piechart
    # if chart_type in ["column", "bar"]:
    #     chart_type = "barchart"
    # elif chart_type == "pie":
    #     chart_type = "piechart"
    # else:
    #     chart_type = "unknown"
    
    title = read_text_file("Statista Dataset/indo-version-clean/titles", file_id)      # Folder judul Statista
    description = read_text_file("Statista Dataset/indo-version-clean/descriptions", file_id)  # Folder deskripsi Statista
    
    statista_rows.append({
        "id": file_id,
        "title": title,
        "description": description,
        "chartType": chart_type
    })

statista_df = pd.DataFrame(statista_rows)

# === BPS ===
# Asumsikan kamu punya dua CSV: satu untuk description dan satu untuk title, dengan kolom 'id'
bps_descriptions_file = "BPS Dataset Version 2/combined_descriptions.csv"  # kolom: id, description
bps_titles_file = "BPS Dataset Version 2/bps_titles.csv"              # kolom: id, title
bps_desc_df = pd.read_csv(bps_descriptions_file)
bps_title_df = pd.read_csv(bps_titles_file)

# Ekstrak prefix dari kolom 'id' di bps_descriptions, misalnya 'T0001' dari 'T0001_bar_a'
bps_desc_df["prefix"] = bps_desc_df["id"].apply(lambda x: x.split("_")[0])

# Gabungkan berdasarkan prefix, dimana bps_titles_df.id adalah kunci untuk judul
merged_df = pd.merge(
    bps_desc_df,
    bps_title_df,
    left_on="prefix",
    right_on="id",
    how="left",
    suffixes=("", "_title")
)

def extract_chart_type(id_str):
    if "_bar_" in id_str:
        return "bar"
    elif "_column_" in id_str:
        return "column"
    elif "_donut_" in id_str:
        return "donut"
    elif "_pie_" in id_str:
        return "pie"
    else:
        return "unknown"

merged_df["chartType"] = merged_df["id"].apply(extract_chart_type)


# Ubah nama kolom 'id' menjadi 'id_desc'
bps_df_final = merged_df.rename(columns={"id": "id_desc"})[["id_desc", "title", "description", "chartType"]]

# === GABUNGKAN KEDUA DATASET ===
combined_df = pd.concat([statista_df, bps_df_final], ignore_index=True)
output_csv = "metadata_indochart_version_2.csv"
combined_df.to_csv(output_csv, index=False, encoding="utf-8")

print(f"Metadata gabungan berhasil disimpan di {output_csv}")