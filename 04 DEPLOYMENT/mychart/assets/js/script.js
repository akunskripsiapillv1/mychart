// Variabel global di script.js
const API_BASE_URL = 'https://ds.stis.ac.id/mychart-api';

// Fungsi reusable untuk menampilkan notifikasi toast
function showToast(message, type = 'info') { // type bisa 'success', 'error', atau 'info'
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Atur waktu untuk menghilangkan toast
    setTimeout(() => {
        toast.classList.add('fade-out');
        // Hapus elemen setelah animasi fade-out selesai
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000); // Toast akan hilang setelah 4 detik
}

document.addEventListener("DOMContentLoaded", () => {
    // --- FUNGSI GLOBAL ---
    // Cek status login dan update navbar di semua halaman
    const checkLoginStatus = () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const navLinks = document.getElementById('nav-links');
        const authButton = document.getElementById('auth-button');

        if (!authButton) {
            return; // Hentikan fungsi jika tombol tidak ada (seperti di halaman sign-in)
        }

        if (isLoggedIn) {
            // Hapus link "Demo" yang mungkin sudah ada
            const existingDemoLink = document.getElementById('demo-nav-link');
            if (existingDemoLink) existingDemoLink.remove();
            
            // Tambahkan link "Demo"
            const demoLink = document.createElement('li');
            demoLink.id = 'demo-nav-link';
            demoLink.innerHTML = `<a href="demo.html">Demo</a>`;
            navLinks.appendChild(demoLink);
            
            // Ubah tombol "Sign In" menjadi "Sign Out"
            authButton.innerHTML = `<a href="#" id="logout-button" class="nav-button">Sign Out</a>`;
        } else {
            // Pastikan link Demo tidak ada jika belum login
             const demoLink = document.getElementById('demo-nav-link');
             if (demoLink) demoLink.remove();
             authButton.innerHTML = `<a href="signin.html" class="nav-button">Sign In</a>`;
        }
    };

    checkLoginStatus(); // Panggil fungsi saat halaman dimuat

    // Responsiveness
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Active pages
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks_a = document.querySelectorAll(".nav-links a");

    navLinks_a.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPage) {
            link.classList.add("active");
        }
    });

    // HALAMAN DATA STORIES
    const modal = document.getElementById('chart-modal');
    if (modal) {
        const viewDetailButtons = document.querySelectorAll('.btn-view-details');
        const modalBody = document.getElementById('modal-body-content');
        const closeModalButton = modal.querySelector('.modal-close');
        const modalOverlay = modal.querySelector('.modal-overlay');

        // Fungsi untuk membuka modal
        viewDetailButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.modalTarget;
                const modalDataContainer = document.getElementById(`${modalId}-data`);
                
                if (modalDataContainer) {
                    modalBody.innerHTML = modalDataContainer.innerHTML;
                    modal.classList.add('active');
                } else {
                    showToast('Gagal memuat detail data.', 'error');
                }
            });
        });

        // Fungsi untuk menutup modal
        const closeModal = () => {
            modal.classList.remove('active');
        };

        closeModalButton.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
    }

    // --- LOGIKA HALAMAN HOME ---
    if (document.querySelector('.under-the-hood')) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });
    }

    // --- LOGIKA HALAMAN SIGN IN ---
    if (document.getElementById('signin-form')) {
        const signinForm = document.getElementById('signin-form');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('toggle-password');

        // Toggle show/hide password
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });

        // Logika Login ke API
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('email').value; // Frontend menggunakan 'email' sebagai username
            const password = passwordInput.value;

            // Backend mengharapkan form data, bukan JSON
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    // Tampilkan pesan error dari API jika login gagal
                    showToast(`Sign in Gagal: ${data.detail || 'Email atau password salah'}`, 'error');
                    return;
                }

                // Jika berhasil, simpan token di localStorage
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('isLoggedIn', 'true'); // Kita tetap gunakan ini untuk update UI

                showToast('Anda berhasil Sign in', 'success');
                
                // Arahkan ke halaman demo
                setTimeout(() => { window.location.href = 'demo.html'; }, 1000);;

            } catch (error) {
                console.error('Error saat login:', error);
                showToast('Terjadi kesalahan. Periksa koneksi Anda.', 'error');
            }
        });
    }

    // --- LOGIKA SIGN OUT ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah link berpindah halaman
            
            // Hapus data login dari penyimpanan browser
            localStorage.removeItem('accessToken');
            localStorage.removeItem('isLoggedIn');
            
            // Arahkan pengguna kembali ke halaman utama
            showToast('Anda berhasil logout', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        });
    }

    // --- Fungsi baru untuk mengambil dan menampilkan kuota ---
    const fetchUserQuota = async () => {
        const quotaDisplay = document.getElementById('quota-display');
        const accessToken = localStorage.getItem('accessToken');
        
        // Hanya jalankan jika elemen ada dan pengguna sudah login
        if (!quotaDisplay || !accessToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/quota`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!response.ok) throw new Error('Gagal memuat kuota');
            
            const data = await response.json();
            quotaDisplay.textContent = `Daily Quota: ${data.used} / ${data.limit}`;
            quotaDisplay.style.display = 'block';

        } catch (error) {
            console.error('Error fetching quota:', error);
            quotaDisplay.style.display = 'none'; // Sembunyikan jika gagal
        }
    };


    // --- LOGIKA HALAMAN DEMO ---
    if (document.querySelector('.demo-container')) {
        // Pastikan user sudah login, jika tidak, tendang ke halaman signin
        if (localStorage.getItem('isLoggedIn') !== 'true' || !localStorage.getItem('accessToken')) {
            window.location.href = 'signin.html';
        }
        fetchUserQuota();

        // --- Deklarasi Elemen ---
        const modelOptions = document.querySelectorAll('.model-option');
        const generateBtn = document.getElementById('generate-btn');
        const loader = document.getElementById('loader');
        const resultPlaceholder = document.getElementById('result-placeholder');
        const resultContent = document.getElementById('result-content');
        const copyBtn = document.getElementById('copy-btn');
        const fileInput = document.getElementById('file-input');
        const urlInput = document.getElementById('url-input');
        const inputTabs = document.querySelectorAll('.input-tab-button');
        const inputContents = document.querySelectorAll('.input-content');
        const dropArea = document.getElementById('drop-area');
        const dropAreaPrompt = document.getElementById('drop-area-prompt');
        const dropAreaPreview = document.getElementById('drop-area-preview');
        const previewContainer = document.getElementById('image-preview-container');
        const previewImageElement = document.getElementById('preview-image-element');
        
        // --- Bagian event listener untuk UI tetap sama ---
        let selectedModel = 'chartinstruct'; // Sesuaikan dengan nama di API
        let imageFile = null;

        // --- Bagian untuk pilih model ---
        modelOptions.forEach(option => {
            option.addEventListener('click', () => {
                modelOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedModel = option.dataset.model.toLowerCase(); // Ambil model 'chartinstruct' atau 'unichart'
            });
        });

        // --- Fungsi untuk Mereset Semua Input & Preview ---
        const resetAllInputs = () => {
            // Reset variabel global
            imageFile = null;
            
            // Reset input file dan URL
            fileInput.value = '';
            urlInput.value = '';

            // Sembunyikan container preview utama
            previewContainer.style.display = 'none';
            previewImageElement.src = '#';

            // Kembalikan drop area ke kondisi awal
            dropAreaPrompt.style.display = 'block';
            dropAreaPreview.innerHTML = '';
            dropAreaPreview.style.display = 'none';
        };

        // --- Logika untuk Berpindah Tab ---
        inputTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Reset semua input SEBELUM pindah tab
                resetAllInputs();

                // Logika pindah tab
                inputTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                inputContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        // --- Fungsi Helper ---

        // Fungsi untuk menampilkan error di kotak preview
        const showPreviewError = (message) => {
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = `<div class="preview-error-message">${message}</div>`;
        };

        // Fungsi untuk menampilkan preview yang berhasil
        const showPreviewSuccess = (src) => {
            // Kembalikan struktur asli jika sebelumnya ada error
            previewContainer.innerHTML = `<h3>Image Preview:</h3><img id="preview-image-element" src="#" alt="Image Preview"/>`;
            const newPreviewImg = document.getElementById('preview-image-element');
            newPreviewImg.src = src;
            previewContainer.style.display = 'block';

            // Tambahkan error handler untuk gambar dari URL
            newPreviewImg.onerror = () => {
                showToast('URL gambar tidak valid atau gagal dimuat.', 'error');
                showPreviewError('Input gambar gagal dimuat');
                imageFile = null;
            };
        };
    

        // --- Fungsi untuk memproses file (dari klik atau drop) ---
        const handleFile = (file) => {
            if (file && file.type.startsWith('image/')) {
                imageFile = file; // Simpan file untuk dikirim ke API

                // Tampilkan preview di drop area
                dropAreaPrompt.style.display = 'none';
                dropAreaPreview.innerHTML = `<p class="filename">📊 ${file.name}</p>`;
                dropAreaPreview.style.display = 'flex';
                
                // Tampilkan preview di container utama
                const reader = new FileReader();
                reader.onload = (event) => {
                    showPreviewSuccess(event.target.result);
                }
                reader.readAsDataURL(file);
            } else {
                showToast('File tidak valid. Harap pilih file gambar.', 'error');
                howPreviewError('Input gambar gagal dimuat');
            }
        };

        // --- Event Listener untuk Input File (Klik)---
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });

        // --- Event Listener untuk Drag and Drop ---
        dropArea.addEventListener('click', () => fileInput.click());

        // 1. Cegah perilaku default browser saat file diseret ke atas area
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragging');
        });

        // 2. Hapus efek visual saat file ditarik keluar dari area
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragging');
        });

        // 3. Tangani file saat dijatuhkan (di-drop) ke area
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragging');

            // Ambil file yang di-drop
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });

        // --- Event Listener untuk Paste dari Clipboard ---
        window.addEventListener('paste', (e) => {
            // Cek apakah fokus tidak sedang di input URL untuk menghindari duplikasi
            if (document.activeElement === urlInput) return;

            const file = e.clipboardData.files[0];
            if (file) {
                // Jika ada file di clipboard, proses dengan handleFile
                handleFile(file);
            }
        });


        // --- Event Listener untuk Input URL ---
        urlInput.addEventListener('input', () => {
            const url = urlInput.value.trim();
            if (url) {
                imageFile = null; // Kosongkan file jika user beralih ke URL
                showPreviewSuccess(url);
            } else {
                previewContainer.style.display = 'none';
            }
        });

        // --- Logika Tombol Copy ---
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('description-text').textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('Gagal menyalin teks.', 'error');
            });
        });


        // --- LOGIKA UTAMA: Tombol Generate yang terhubung ke API ---
        generateBtn.addEventListener('click', async () => {
            const activeTab = document.querySelector('.input-tab-button.active').dataset.tab;
            const inputType = (activeTab === 'upload-tab') ? 'upload' : 'url';

            const isImageProvided = (inputType === 'upload' && imageFile) || (inputType === 'url' && urlInput.value.trim());
            if (!isImageProvided) {
                showToast('Silakan unggah gambar atau berikan URL.', 'error');
                return;
            }

            // 1. Ambil token dari localStorage
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
                setTimeout(() => { window.location.href = 'signin.html'; }, 2000);
                return;
            }
            
            // Tampilkan loading
            loader.style.display = 'block';
            resultPlaceholder.style.display = 'none';
            resultContent.style.display = 'none';
            const startTime = Date.now(); // Catat waktu mulai

            // 2. Tentukan endpoint, headers, dan body
            const endpoint = `${API_BASE_URL}/${selectedModel}/${inputType}`;
            const headers = {
                'Authorization': `Bearer ${accessToken}`
            };
            let body;

            if (inputType === 'upload') {
                body = new FormData();
                body.append('file', imageFile);
            } else { // inputType === 'url'
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify({ image_url: urlInput.value });
            }
            
            try {
                // 3. Panggil API
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: body
                });
                
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Terjadi kesalahan pada server');
                }

                // 4. Tampilkan hasil jika sukses
                const endTime = Date.now();
                const responseTime = ((endTime - startTime) / 1000).toFixed(2);

                const rawModelName = data.used_model;
                let formattedModelName = rawModelName; // Nilai default

                if (rawModelName === 'unichart') {
                    formattedModelName = 'UniChart';
                } else if (rawModelName === 'chartinstruct') {
                    formattedModelName = 'ChartInstruct-Llama';
                }

                document.getElementById('description-text').textContent = data.description;
                document.getElementById('model-used').textContent = `Model: ${formattedModelName}`;
                document.getElementById('response-time').textContent = `Response time: ${responseTime}s`;

                resultContent.style.display = 'block';
                showToast('Deskripsi berhasil dibuat!', 'success');

                fetchUserQuota();
            } catch (error) {
                console.error('Error saat generate deskripsi:', error);
                showToast(`Gagal: ${error.message}`, 'error');
                resultPlaceholder.style.display = 'block'; // Tampilkan lagi placeholder jika error
            } finally {
                // 5. Selalu sembunyikan loader setelah selesai
                loader.style.display = 'none';
            }
        });
    }


    // HALAMAN GENERATE CHARTS
    const generateForm = document.getElementById('generate-form');
    if (generateForm) {
        const dataFileInput = document.getElementById('data-file');
        const previewContainer = document.getElementById('table-preview-container');
        const previewContent = document.getElementById('table-preview-content');
        const loadingSpinner = document.getElementById('loading-spinner');
        const resultsContainer = document.getElementById('results-container');
        const accessToken = localStorage.getItem('accessToken');

        // Event listener saat pengguna memilih file
        dataFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            previewContainer.style.display = 'block';
            previewContent.innerHTML = '<div class="loader"></div>';

            const reader = new FileReader();

            // Fungsi onload sekarang akan menangani data yang sudah dibaca dengan benar
            reader.onload = (event) => {
                try {
                    const data = event.target.result;
                    let rows;
                    const fileExtension = file.name.split('.').pop().toLowerCase();

                    if (fileExtension === 'csv') {
                        // 'data' di sini adalah STRING, jadi .split() akan berhasil
                        const lines = data.split(/\r\n|\n/);
                        rows = lines.map(line => line.split(','));
                    } else if (fileExtension === 'xlsx') {
                        // 'data' di sini adalah ArrayBuffer, sesuai yang dibutuhkan SheetJS
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    }
                    
                    renderTable(rows);

                } catch (error) {
                    handlePreviewError("Gagal mem-parsing file. Pastikan formatnya benar.");
                }
            };

            reader.onerror = () => {
                handlePreviewError("Gagal membaca file.");
            };
            
            // --- PERBAIKAN UTAMA ADA DI SINI ---
            // Pilih metode baca berdasarkan ekstensi file
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'csv') {
                reader.readAsText(file); // Baca CSV sebagai teks
            } else if (fileExtension === 'xlsx') {
                reader.readAsArrayBuffer(file); // Baca XLSX sebagai ArrayBuffer
            } else {
                handlePreviewError("Format file tidak didukung. Harap unggah .csv atau .xlsx");
            }
        });

        // Fungsi untuk menampilkan tabel di preview
        function renderTable(rows) {
            if (!rows || rows.length === 0) {
                handlePreviewError("File kosong atau tidak dapat dibaca.");
                return;
            }

            let tableHTML = '<table class="table-preview"><thead><tr>';
            // Buat header
            rows[0].forEach(headerText => {
                tableHTML += `<th>${headerText}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            // Buat baris data
            for (let i = 1; i < rows.length; i++) {
                tableHTML += '<tr>';
                rows[i].forEach(cellText => {
                    tableHTML += `<td>${cellText}</td>`;
                });
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table>';

            previewContent.innerHTML = tableHTML;
        }

        // Fungsi untuk menangani error preview
        function handlePreviewError(message) {
            showToast(message, 'error');
            previewContent.innerHTML = `<div class="preview-error-message">Tabel tidak bisa dimuat</div>`;
        }

        generateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!accessToken) {
                showToast('Sesi Anda habis, silakan login kembali.', 'error');
                return;
            }

            loadingSpinner.style.display = 'block';
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';

            const formData = new FormData(generateForm);

            try {
                const response = await fetch(`${API_BASE_URL}/chart/from-table`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Gagal membuat grafik");
                }
                
                showToast('Grafik berhasil dibuat!', 'success');
                displayResults(data.generated_charts);

            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });

        function displayResults(charts) {
            const resultsContainer = document.getElementById('results-container');
            resultsContainer.style.display = 'grid';
            resultsContainer.innerHTML = '';

            const renderCharts = (chartDict, title) => {
                if (chartDict) {
                    const sectionTitle = document.createElement('h3');
                    sectionTitle.textContent = title;
                    sectionTitle.style.gridColumn = '1 / -1';
                    resultsContainer.appendChild(sectionTitle);

                    for (const style in chartDict) {
                        const item = document.createElement('div');
                        item.className = 'chart-result-item';

                        // --- PERUBAHAN UTAMA ADA DI SINI ---
                        const base64String = chartDict[style];
                        // Buat data URL dari string base64
                        const imageUrl = `data:image/png;base64,${base64String}`;
                        
                        item.innerHTML = `
                            <img src="${imageUrl}" alt="${style}">
                            <h4>Style: ${style}</h4>
                        `;
                        resultsContainer.appendChild(item);
                    }
                }
            };
            
            renderCharts(charts.barcharts, "Bar & Column Charts");
            renderCharts(charts.piecharts, "Pie & Donut Charts");
        }
    }
});