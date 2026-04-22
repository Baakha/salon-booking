// client/script.js

// Адрес нашего Node.js сервера (если на реальном сервере — замени localhost на IP или домен)
const API_URL = "https://salon-booking-ycq5.onrender.com";

let selTime = null;

// По умолчанию ставим сегодняшнюю дату
const today = new Date().toISOString().split('T')[0];
document.getElementById('dateInput').value = today;

// 1. ЗАГРУЗКА ЗАНЯТЫХ СЛОТОВ С СЕРВЕРА
async function load() {
  const d = document.getElementById('dateInput').value;
  const m = document.getElementById('master').value;
  const grid = document.getElementById('slots');
  
  grid.innerHTML = "Загрузка...";

  // Делаем GET запрос с параметрами в URL: /api/busy-slots?date=2024-05-10&master=Анна
  try {
    const res = await fetch(`${API_URL}/busy-slots?date=${d}&master=${m}`);
    const busyTimes = await res.json(); // Получаем массив, например ["09:00", "14:00"]
    
    if (Array.isArray(busyTimes)) {
        draw(busyTimes);
    } else {
        grid.innerHTML = "Ошибка данных с сервера.";
    }

  } catch (e) {
    grid.innerHTML = "Ошибка связи с сервером.";
  }
}

// 2. ОТРИСОВКА (Осталась почти без изменений)
function draw(busyTimes) {
  const grid = document.getElementById('slots');
  grid.innerHTML = "";

  const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  times.forEach(t => {
    const isBusy = busyTimes.includes(t); // Сравниваем время

    const div = document.createElement("div");
    div.className = "slot " + (isBusy ? "busy" : "free");
    div.innerText = t;

    if (!isBusy) {
      div.onclick = () => {
        // Убираем выделение у всех и добавляем к выбранному
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
        div.classList.add("selected");
        selTime = t; // Запоминаем время
      };
    }

    grid.appendChild(div);
  });
}

// 3. ОТПРАВКА ЗАПИСИ НА СЕРВЕР (С ОБРАБОТКОЙ ОТВЕТА)
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
    // Отправляем POST запрос на /api/book
    const res = await fetch(`${API_URL}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "ALREADY_BUSY") {
        alert("ОЙ! Это время уже успел кто-то занять. Календарь обновится.");
        load(); // Обновляем календарь
    } else if (result.status === "SUCCESS") {
        alert("Запись прошла успешно! Ждем вас.");
        selTime = null;
        load(); // Обновляем календарь
    } else {
        alert("Ошибка сервера при записи.");
    }

  } catch (e) {
    alert("Ошибка связи с сервером при отправке записи.");
  }
};

// При изменении даты или мастера — перезагружаем слоты
document.getElementById("dateInput").onchange = load;
document.getElementById("master").onchange = load;

// Первая загрузка
load();