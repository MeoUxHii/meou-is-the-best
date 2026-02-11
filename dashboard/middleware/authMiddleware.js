const requireLogin = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireGuildSelection = (req, res, next) => {
    if (!req.session || !req.session.isAuthenticated) return res.redirect('/login');
    next();
};

module.exports = { requireLogin, requireGuildSelection };