const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

function startDashboard(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/pictures', express.static(path.join(__dirname, '../pictures')));

    app.use(session({
        secret: 'meou_dashboard_super_secret',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 3600000 } 
    }));

    const authRoutes = require('./routes/authRoutes')(client);
    const homeRoutes = require('./routes/homeRoutes')(client);
    const serverRoutes = require('./routes/serverRoutes')(client);
    const generalConfigRoutes = require('./routes/generalConfigRoutes')(client); 
    const userRoutes = require('./routes/userRoutes')(client);

    app.use('/', authRoutes);
    app.use('/', homeRoutes);
    app.use('/', serverRoutes);
    app.use('/', generalConfigRoutes);
    app.use('/', userRoutes);

    app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Dashboard Master Online: Port ${PORT}`);
});
}

module.exports = startDashboard;
