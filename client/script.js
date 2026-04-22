const API_URL = "https://salon-booking-ycq5.onrender.com/api";
let selTime = null;

// Установка даты (сегодня)
const today = new Date().toISOString().split('T')[0];
document.getElementById('dateInput').value = today;

async function load() {
    const d = document.getElementById('dateInput').value;
    const m = document.getElementById('master').value;
    const grid = document.getElementById('slots');
    
    grid.innerHTML = "Загрузка...";

    try {
        const res = await fetch(`${API_URL}/busy-slots?date=${d}&master=${m}`);
        const rawBusyTimes = await res.json();
        
        if (Array.isArray(rawBusyTimes)) {
            // ФИКС: Отрезаем секунды (10:00:00 -> 10:00), чтобы сравнение сработало
            const cleanBusyTimes = rawBusyTimes.map(t => t.substring(0, 5));
            draw(cleanBusyTimes);
        } else {
            grid.innerHTML = "Ошибка данных.";
        }
    } catch (e) {
        grid.innerHTML = "Ошибка связи с сервером.";
    }
}

function draw(busyTimes) {
    const grid = document.getElementById('slots');
    grid.innerHTML = "";

    const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

    times.forEach(t => {
        const isBusy = busyTimes.includes(t); 

        const div = document.createElement("div");
        // Класс busy для красного цвета, free для доступного
        div.className = "slot " + (isBusy ? "busy" : "free");
        div.innerText = t;

        if (!isBusy) {
            div.onclick = () => {
                document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
                div.classList.add("selected");
                selTime = t;
            };
        }
        grid.appendChild(div);
    });
}

document.getElementById("bookBtn").onclick = async function () {
    const name = document.getElementById("userName").value;
    const phone = document.getElementById("userPhone").value;
    const date = document.getElementById("dateInput").value;
    const master = document.getElementById("master").value;

    if (!name || !phone || !selTime) {
        alert("Заполни все поля и выбери время");
        return;
    }

    const payload = {
        name, phone, date, 
        time: selTime,
        master,
        service: document.getElementById("service").value,
        price: document.getElementById("service").selectedOptions[0].dataset.price
    };

    try {
        const res = await fetch(`${API_URL}/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.status === "ALREADY_BUSY") {
            alert("Это время уже занято!");
            load();
        } else if (result.status === "SUCCESS") {
            alert("Запись успешна!");
            selTime = null;
            load();
        }
    } catch (e) {
        alert("Ошибка при записи.");
    }
};

document.getElementById("dateInput").onchange = load;
document.getElementById("master").onchange = load;
load();
