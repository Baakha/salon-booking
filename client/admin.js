const API_URL = "https://salon-booking-ycq5.onrender.com/api";

async function loadData() {
    try {
        const res = await fetch(`${API_URL}/admin/appointments`);
        const data = await res.json();
        
        // Получаем сегодняшнюю дату в формате ГГГГ-ММ-ДД
        const today = new Date().toISOString().split('T')[0];
        
        // Фильтруем: активные (сегодня и будущее) и архив (прошлое)
        const active = data.filter(item => item.date >= today);
        const archive = data.filter(item => item.date < today);

        render(active, 'active-list');
        render(archive, 'archive-list');
    } catch (e) {
        alert("Ошибка загрузки данных");
    }
}

function render(items, containerId) {
    const div = document.getElementById(containerId);
    div.innerHTML = "";

    if (items.length === 0) {
        div.innerHTML = `<p style="text-align:center; color: #999;">Записей пока нет</p>`;
        return;
    }

    // Группировка по датам
    const groups = items.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});

    // Сортировка дат: для архива — новые сверху, для активных — ближайшие сверху
    const sortedDates = Object.keys(groups).sort((a, b) => 
        containerId === 'active-list' ? a.localeCompare(b) : b.localeCompare(a)
    );

    sortedDates.forEach(date => {
        let html = `<div class="date-group"><div class="date-header">${formatDate(date)}</div>`;
        
        groups[date].forEach(item => {
            html += `
                <div class="record-card">
                    <div class="info">
                        <b>${item.time.substring(0, 5)}</b> — ${item.name}
                        <small>📍 ${item.master} | ✂️ ${item.service} | 📞 ${item.phone}</small>
                    </div>
                    <button class="btn-del" onclick="deleteRec(${item.id})">Удалить</button>
                </div>
            `;
        });
        html += `</div>`;
        div.insertAdjacentHTML('beforeend', html);
    });
}

async function deleteRec(id) {
    if (!confirm("Удалить эту запись?")) return;
    await fetch(`${API_URL}/admin/appointments/${id}`, { method: 'DELETE' });
    loadData();
}

function showTab(type) {
    document.getElementById('active-list').style.display = type === 'active' ? 'block' : 'none';
    document.getElementById('archive-list').style.display = type === 'archive' ? 'block' : 'none';
    document.getElementById('btn-active').classList.toggle('active', type === 'active');
    document.getElementById('btn-archive').classList.toggle('active', type === 'archive');
}

function formatDate(s) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const d = new Date(s);
    return `${days[d.getDay()]}, ${d.toLocaleDateString('ru-RU')}`;
}

loadData();
