const cars = {
    avanza: { name: 'Toyota Avanza', price: 500000 },
    innova: { name: 'Toyota Kijang Innova', price: 700000 },
    hrv: { name: 'Honda HRV', price: 600000 },
    sigra: { name: 'Daihatsu Sigra', price: 450000 }
};

// DOM elements
const carCheckboxes = document.querySelectorAll('.car-checkbox');
const calculateBtn = document.getElementById('calculateTotal');
const saveBookingBtn = document.getElementById('saveBooking');
const customerNameInput = document.getElementById('customerName');
const summarySection = document.getElementById('summarySection');
const summaryContent = document.getElementById('summaryContent');
const totalAmount = document.getElementById('totalAmount');
const bookingList = document.getElementById('bookingList');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.start-date').forEach(input => {
        input.min = today;
        input.value = today;
    });

    // Load existing bookings
    loadBookings();

    // Add event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Car checkbox change events
    carCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const carType = this.dataset.car;
            const rentalInputs = document.querySelector(`.rental-inputs[data-car="${carType}"]`) || 
                                this.closest('.car-card').querySelector('.rental-inputs');
            
            if (this.checked) {
                rentalInputs.classList.add('active');
            } else {
                rentalInputs.classList.remove('active');
            }
        });
    });

    // Calculate total button
    calculateBtn.addEventListener('click', calculateTotal);

    // Save booking button
    saveBookingBtn.addEventListener('click', saveBooking);

    // Duration input changes
    document.querySelectorAll('.duration').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 1) {
                this.value = 1;
            }
        });
    });
}

function calculateTotal() {
    const customerName = customerNameInput.value.trim();
    
    if (!customerName) {
        alert('Silakan masukkan nama pelanggan terlebih dahulu!');
        customerNameInput.focus();
        return;
    }

    const selectedCars = getSelectedCars();
    
    if (selectedCars.length === 0) {
        alert('Silakan pilih minimal satu mobil!');
        return;
    }

    // Validate dates and durations
    let isValid = true;
    selectedCars.forEach(car => {
        if (!car.startDate) {
            alert(`Silakan pilih tanggal mulai untuk ${car.name}!`);
            isValid = false;
            return;
        }
        if (car.duration < 1) {
            alert(`Durasi sewa untuk ${car.name} minimal 1 hari!`);
            isValid = false;
            return;
        }
    });

    if (!isValid) return;

    displaySummary(selectedCars, customerName);
}

function getSelectedCars() {
    const selectedCars = [];
    
    carCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const carType = checkbox.dataset.car;
            const price = parseInt(checkbox.dataset.price);
            const startDateInput = document.querySelector(`.start-date[data-car="${carType}"]`);
            const durationInput = document.querySelector(`.duration[data-car="${carType}"]`);
            
            const startDate = startDateInput.value;
            const duration = parseInt(durationInput.value) || 1;
            const subtotal = price * duration;
            
            selectedCars.push({
                type: carType,
                name: cars[carType].name,
                price: price,
                startDate: startDate,
                duration: duration,
                subtotal: subtotal
            });
        }
    });
    
    return selectedCars;
}

function displaySummary(selectedCars, customerName) {
    let summaryHTML = `<h3>Pelanggan: ${customerName}</h3>`;
    let total = 0;
    
    selectedCars.forEach(car => {
        total += car.subtotal;
        const endDate = calculateEndDate(car.startDate, car.duration);
        
        summaryHTML += `
            <div class="summary-item">
                <h4>${car.name}</h4>
                <p>Tanggal: ${formatDate(car.startDate)} - ${formatDate(endDate)}</p>
                <p>Durasi: ${car.duration} hari</p>
                <p>Harga per hari: ${formatCurrency(car.price)}</p>
                <p><strong>Subtotal: ${formatCurrency(car.subtotal)}</strong></p>
            </div>
        `;
    });
    
    summaryContent.innerHTML = summaryHTML;
    totalAmount.textContent = `Total: ${formatCurrency(total)}`;
    summarySection.style.display = 'block';
    
    // Scroll to summary
    summarySection.scrollIntoView({ behavior: 'smooth' });
}

function saveBooking() {
    const customerName = customerNameInput.value.trim();
    const selectedCars = getSelectedCars();
    
    if (!customerName || selectedCars.length === 0) {
        alert('Silakan lengkapi data pemesanan terlebih dahulu!');
        return;
    }
    
    const booking = {
        id: generateBookingId(),
        customerName: customerName,
        cars: selectedCars,
        total: selectedCars.reduce((sum, car) => sum + car.subtotal, 0),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toLocaleString('id-ID')
    };
    
    // Save to localStorage
    const bookings = getBookingsFromStorage();
    bookings.push(booking);
    localStorage.setItem('carRentalBookings', JSON.stringify(bookings));
    
    // Reset form
    resetForm();
    
    // Reload bookings display
    loadBookings();
    
    alert('Pemesanan berhasil disimpan!');
}

function resetForm() {
    customerNameInput.value = '';
    carCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        const carType = checkbox.dataset.car;
        const rentalInputs = document.querySelector(`.rental-inputs[data-car="${carType}"]`) || 
                            checkbox.closest('.car-card').querySelector('.rental-inputs');
        rentalInputs.classList.remove('active');
    });
    
    // Reset dates and durations
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.start-date').forEach(input => {
        input.value = today;
    });
    document.querySelectorAll('.duration').forEach(input => {
        input.value = 1;
    });
    
    summarySection.style.display = 'none';
}

function loadBookings() {
    const bookings = getBookingsFromStorage();
    
    if (bookings.length === 0) {
        bookingList.innerHTML = '<p class="no-bookings">Belum ada pemesanan</p>';
        return;
    }
    
    let bookingsHTML = '';
    bookings.reverse().forEach(booking => {
        bookingsHTML += `
            <div class="booking-item">
                <div class="booking-header">
                    <div class="booking-info">
                        <h4>Pemesanan #${booking.id}</h4>
                        <p><strong>Pelanggan:</strong> ${booking.customerName}</p>
                        <p class="booking-timestamp">Dibuat: ${booking.createdAt}</p>
                    </div>
                    <button class="btn btn-danger" onclick="deleteBooking('${booking.id}')">Hapus</button>
                </div>
                <div class="booking-cars">
                    ${booking.cars.map(car => `
                        <div class="booking-car">
                            <strong>${car.name}</strong> - 
                            ${formatDate(car.startDate)} (${car.duration} hari) - 
                            ${formatCurrency(car.subtotal)}
                        </div>
                    `).join('')}
                </div>
                <div class="booking-total">
                    Total: ${formatCurrency(booking.total)}
                </div>
            </div>
        `;
    });
    
    bookingList.innerHTML = bookingsHTML;
}

function deleteBooking(bookingId) {
    if (!confirm('Apakah Anda yakin ingin menghapus pemesanan ini?')) {
        return;
    }
    
    const bookings = getBookingsFromStorage();
    const filteredBookings = bookings.filter(booking => booking.id !== bookingId);
    localStorage.setItem('carRentalBookings', JSON.stringify(filteredBookings));
    
    loadBookings();
    alert('Pemesanan berhasil dihapus!');
}

function getBookingsFromStorage() {
    const bookings = localStorage.getItem('carRentalBookings');
    return bookings ? JSON.parse(bookings) : [];
}

function generateBookingId() {
    return 'BK' + Date.now().toString().slice(-8);
}

function calculateEndDate(startDate, duration) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + duration - 1);
    return end.toISOString().split('T')[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Add smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Add loading animation for better UX
function showLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Memproses...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}