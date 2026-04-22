const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const Appointment = sequelize.define('Appointment', {
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    master: { type: DataTypes.STRING, allowNull: false },
    service: { type: DataTypes.STRING },
    price: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// API Маршруты
app.get('/api/busy-slots', async (req, res) => {
    const { date, master } = req.query;
    const apps = await Appointment.findAll({ where: { date, master }, attributes: ['time'] });
    res.json(apps.map(a => a.time));
});

app.post('/api/book', async (req, res) => {
    try {
        const newApp = await Appointment.create(req.body);
        res.status(201).json({ status: 'SUCCESS', data: newApp });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/appointments', async (req, res) => {
    const all = await Appointment.findAll({ order: [['date', 'ASC'], ['time', 'ASC']] });
    res.json(all);
});

// НОВЫЙ МАРШРУТ: Удаление
app.delete('/api/admin/appointments/:id', async (req, res) => {
    await Appointment.destroy({ where: { id: req.params.id } });
    res.json({ status: 'DELETED' });
});

app.use(express.static(path.join(__dirname, 'client')));
app.get(/^(?!\/api).+/, (req, res) => res.sendFile(path.join(__dirname, 'client', 'index.html')));

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`)));
