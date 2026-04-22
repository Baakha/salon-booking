// appointment.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Appointment = sequelize.define('Appointment', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false }, // ГГГГ-ММ-ДД
  time: { type: DataTypes.TIME, allowNull: false },     // ЧЧ:ММ
  master: { type: DataTypes.STRING, allowNull: false },
  service: { type: DataTypes.STRING },
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  // Защита от двойной записи: Уникальная комбинация [дата, мастер, время]
  indexes: [
    {
      unique: true,
      fields: ['date', 'master', 'time']
    }
  ]
});

module.exports = Appointment;