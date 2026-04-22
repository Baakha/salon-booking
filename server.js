const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

const app = express();

// Мидлвары
app.use(cors());
app.use(bodyParser.json());

// 1. ПОДКЛЮЧЕНИЕ К БАЗЕ
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

// 2. МОДЕЛЬ
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

// 3. API МАРШРУТЫ (должны быть ПЕРВЫМИ)

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

app.get('/api/admin/appointments', async (req, res) => {
    try {
        const all = await Appointment.findAll({ order: [['date', 'DESC'], ['time', 'ASC']] });
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка админки' });
    }
});

// 4. СТАТИКА (ФРОНТЕНД)

// Раздаем статические файлы из папки client
app.use(express.static(path.join(__dirname, 'client')));

// Вместо звездочки используем конкретный обработчик для всех остальных путей
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// 5. ЗАПУСК
const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log('✅ База данных подключена');
        app.listen(PORT, () => {
            console.log(`🚀 Сервер на порту ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Ошибка БД:', err);
    });
