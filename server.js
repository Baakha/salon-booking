const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path'); // Добавили модуль для работы с путями
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. НАСТРОЙКА ПОДКЛЮЧЕНИЯ К БАЗЕ (NEON.TECH)
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

// 2. ОПИСАНИЕ МОДЕЛИ ЗАПИСЕЙ
const Appointment = sequelize.define('Appointment', {
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: false },
    master: { type: DataTypes.STRING, allowNull: false },
    service: { type: DataTypes.STRING },
    price: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    indexes: [{ unique: true, fields: ['date', 'master', 'time'] }]
});

// 3. ОБСЛУЖИВАНИЕ СТАТИЧЕСКИХ ФАЙЛОВ (ФРОНТЕНД)
// Это заставит Render показывать твой index.html по прямой ссылке
app.use(express.static(path.join(__dirname, 'client')));

// 4. API МАРШРУТЫ

// Получить занятые слоты
app.get('/api/busy-slots', async (req, res) => {
    const { date, master } = req.query;
    try {
        const appointments = await Appointment.findAll({
            where: { date, master },
            attributes: ['time']
        });
        const busyTimes = appointments.map(a => a.time);
        res.json(busyTimes);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении слотов' });
    }
});

// Создать новую запись
app.post('/api/book', async (req, res) => {
    try {
        const { name, phone, date, time, master, service, price } = req.body;
        const newApp = await Appointment.create({
            name, phone, date, time, master, service, price
        });
        res.status(201).json({ status: 'SUCCESS', data: newApp });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ status: 'ALREADY_BUSY', error: 'Это время уже занято' });
        }
        res.status(500).json({ error: 'Ошибка сервера при записи' });
    }
});

// Получить все записи (для Админки)
app.get('/api/admin/appointments', async (req, res) => {
    try {
        const all = await Appointment.findAll({ order: [['date', 'DESC'], ['time', 'ASC']] });
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка админки' });
    }
});

// Перенаправление всех остальных запросов на index.html (для SPA навигации)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// 5. ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log('✅ База данных подключена и синхронизирована');
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Ошибка синхронизации БД:', err);
    });