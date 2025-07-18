// منصة الفؤاد التعليمية - نظام المصادقة المتقدم

// إعدادات الأمان
const AUTH_CONFIG = {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 ساعة
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 دقيقة
    PASSWORD_MIN_LENGTH: 6,
    ADMIN_EMAILS: [
        'coach.mahmoud.fouad@gmail.com',
        'enneagram.compass@gmail.com',
        'mahmoudfouad25@gmail.com'
    ]
};

// كلاس إدارة المصادقة
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionCheckInterval = null;
        this.init();
    }

    // تهيئة نظام المصادقة
    init() {
        this.loadSession();
        this.startSessionMonitoring();
        this.setupSecurityHeaders();
    }

    // تحميل الجلسة من التخزين المحلي
    loadSession() {
        try {
            const sessionData = localStorage.getItem('fouad_academy_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // التحقق من صحة الجلسة
                if (this.isValidSession(session)) {
                    this.currentUser = session.user;
                    this.updateLastActivity();
                    console.log('تم تحميل جلسة صحيحة للمستخدم:', this.currentUser.name);
                } else {
                    this.clearSession();
                    console.log('جلسة منتهية الصلاحية - تم مسحها');
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل الجلسة:', error);
            this.clearSession();
        }
    }

    // التحقق من صحة الجلسة
    isValidSession(session) {
        if (!session || !session.user || !session.expiresAt) {
            return false;
        }

        const now = new Date().getTime();
        const expirationTime = new Date(session.expiresAt).getTime();
        
        return now < expirationTime;
    }

    // حفظ الجلسة
    saveSession(user) {
        const sessionData = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                joinDate: user.joinDate,
                enrolledCourses: user.enrolledCourses || [],
                avatar: user.avatar || null,
                preferences: user.preferences || {}
            },
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_TIMEOUT).toISOString(),
            sessionId: this.generateSessionId()
        };

        localStorage.setItem('fouad_academy_session', JSON.stringify(sessionData));
        this.currentUser = sessionData.user;
    }

    // مسح الجلسة
    clearSession() {
        localStorage.removeItem('fouad_academy_session');
        this.currentUser = null;
        
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }

    // توليد معرف الجلسة
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    // تحديث آخر نشاط
    updateLastActivity() {
        try {
            const sessionData = JSON.parse(localStorage.getItem('fouad_academy_session') || '{}');
            if (sessionData.user) {
                sessionData.lastActivity = new Date().toISOString();
                localStorage.setItem('fouad_academy_session', JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error('خطأ في تحديث آخر نشاط:', error);
        }
    }

    // بدء مراقبة الجلسة
    startSessionMonitoring() {
        this.sessionCheckInterval = setInterval(() => {
            if (this.currentUser) {
                const sessionData = JSON.parse(localStorage.getItem('fouad_academy_session') || '{}');
                
                if (!this.isValidSession(sessionData)) {
                    this.handleSessionExpiry();
                }
            }
        }, 60000); // فحص كل دقيقة
    }

    // معالجة انتهاء الجلسة
    handleSessionExpiry() {
        this.clearSession();
        
        if (window.showNotification) {
            window.showNotification('انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.', 'warning');
        }

        // إعادة تحميل الصفحة أو إعادة توجيه لتسجيل الدخول
        setTimeout(() => {
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                window.location.href = '/index.html';
            } else {
                window.location.reload();
            }
        }, 3000);
    }

    // إعداد رؤوس الأمان
    setupSecurityHeaders() {
        // إضافة حماية ضد XSS
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
        document.head.appendChild(meta);
    }

    // تسجيل الدخول
    async login(email, password, rememberMe = false) {
        try {
            // التحقق من محاولات تسجيل الدخول
            if (this.isAccountLocked(email)) {
                throw new Error('تم قفل الحساب مؤقتاً بسبب محاولات دخول فاشلة متكررة. حاول مرة أخرى لاحقاً.');
            }

            // التحقق من صحة البيانات
            if (!this.validateLoginData(email, password)) {
                throw new Error('يرجى ملء جميع الحقول بشكل صحيح');
            }

            // البحث عن المستخدم
            const users = this.getAllUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                this.recordFailedAttempt(email);
                throw new Error('البريد الإلكتروني غير مسجل');
            }

            // التحقق من كلمة المرور
            if (!this.verifyPassword(password, user.password)) {
                this.recordFailedAttempt(email);
                throw new Error('كلمة المرور غير صحيحة');
            }

            // نجح تسجيل الدخول
            this.clearFailedAttempts(email);
            this.updateUserLastLogin(user);
            this.saveSession(user);

            // تسجيل النشاط
            this.logSecurityEvent('login_success', {
                userId: user.id,
                email: user.email,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                user: this.currentUser,
                message: `مرحباً بك، ${user.name}!`
            };

        } catch (error) {
            this.logSecurityEvent('login_failed', {
                email: email,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            return {
                success: false,
                message: error.message
            };
        }
    }

    // التسجيل
    async register(userData) {
        try {
            // التحقق من صحة البيانات
            const validation = this.validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // التحقق من عدم وجود المستخدم مسبقاً
            const users = this.getAllUsers();
            if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                throw new Error('البريد الإلكتروني مستخدم بالفعل');
            }

            // إنشاء المستخدم الجديد
            const newUser = this.createNewUser(userData);
            users.push(newUser);
            this.saveAllUsers(users);

            // تسجيل دخول تلقائي
            this.saveSession(newUser);

            // تسجيل النشاط
            this.logSecurityEvent('registration_success', {
                userId: newUser.id,
                email: newUser.email,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                user: this.currentUser,
                message: `مرحباً بك في المنصة، ${newUser.name}! تم منحك دورة "ملاذ الحيارى" مجاناً`
            };

        } catch (error) {
            this.logSecurityEvent('registration_failed', {
                email: userData.email,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            return {
                success: false,
                message: error.message
            };
        }
    }

    // تسجيل الخروج
    logout() {
        if (this.currentUser) {
            this.logSecurityEvent('logout', {
                userId: this.currentUser.id,
                timestamp: new Date().toISOString()
            });
        }

        this.clearSession();
        
        return {
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        };
    }

    // التحقق من صحة بيانات تسجيل الدخول
    validateLoginData(email, password) {
        if (!email || !password) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && password.length >= AUTH_CONFIG.PASSWORD_MIN_LENGTH;
    }

    // التحقق من صحة بيانات التسجيل
    validateRegistrationData(userData) {
        const { name, email, password, confirmPassword } = userData;

        if (!name || !email || !password || !confirmPassword) {
            return { isValid: false, message: 'يرجى ملء جميع الحقول' };
        }

        if (name.length < 2) {
            return { isValid: false, message: 'الاسم يجب أن يكون حرفين على الأقل' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'البريد الإلكتروني غير صحيح' };
        }

        if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
            return { isValid: false, message: `كلمة المرور يجب أن تكون ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} أحرف على الأقل` };
        }

        if (password !== confirmPassword) {
            return { isValid: false, message: 'كلمة المرور وتأكيدها غير متطابقتين' };
        }

        // التحقق من قوة كلمة المرور
        const passwordStrength = this.checkPasswordStrength(password);
        if (!passwordStrength.isStrong) {
            return { isValid: false, message: passwordStrength.message };
        }

        return { isValid: true };
    }

    // فحص قوة كلمة المرور
    checkPasswordStrength(password) {
        const checks = {
            length: password.length >= AUTH_CONFIG.PASSWORD_MIN_LENGTH,
            hasLetter: /[a-zA-Zا-ي]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;

        if (score < 2) {
            return {
                isStrong: false,
                message: 'كلمة المرور ضعيفة. يجب أن تحتوي على أحرف وأرقام على الأقل'
            };
        }

        return { isStrong: true, score };
    }

    // إنشاء مستخدم جديد
    createNewUser(userData) {
        const userId = this.generateUserId();
        const isAdmin = AUTH_CONFIG.ADMIN_EMAILS.includes(userData.email.toLowerCase());

        return {
            id: userId,
            name: userData.name.trim(),
            email: userData.email.toLowerCase(),
            password: this.hashPassword(userData.password),
            role: isAdmin ? 'admin' : 'student',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            enrolledCourses: [1], // إعطاء الدورة المجانية تلقائياً
            avatar: null,
            preferences: {
                language: 'ar',
                notifications: true,
                emailUpdates: true
            },
            profile: {
                phone: '',
                country: 'مصر',
                city: '',
                bio: '',
                interests: []
            },
            stats: {
                totalWatchTime: 0,
                completedCourses: 0,
                certificatesEarned: 0,
                lastActivity: new Date().toISOString()
            }
        };
    }

    // توليد معرف فريد للمستخدم
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    // تشفير كلمة المرور (مبسط - في الإنتاج استخدم bcrypt)
    hashPassword(password) {
        // هذا تشفير مبسط للغاية - في الإنتاج استخدم مكتبة تشفير قوية
        return btoa(password + 'fouad_academy_salt_2025');
    }

    // التحقق من كلمة المرور
    verifyPassword(plainPassword, hashedPassword) {
        return this.hashPassword(plainPassword) === hashedPassword;
    }

    // تسجيل محاولة فاشلة
    recordFailedAttempt(email) {
        const attempts = JSON.parse(localStorage.getItem('fouad_academy_failed_attempts') || '{}');
        const now = Date.now();

        if (!attempts[email]) {
            attempts[email] = { count: 0, lastAttempt: now };
        }

        attempts[email].count++;
        attempts[email].lastAttempt = now;

        localStorage.setItem('fouad_academy_failed_attempts', JSON.stringify(attempts));
    }

    // مسح محاولات فاشلة
    clearFailedAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem('fouad_academy_failed_attempts') || '{}');
        if (attempts[email]) {
            delete attempts[email];
            localStorage.setItem('fouad_academy_failed_attempts', JSON.stringify(attempts));
        }
    }

    // فحص قفل الحساب
    isAccountLocked(email) {
        const attempts = JSON.parse(localStorage.getItem('fouad_academy_failed_attempts') || '{}');
        const userAttempts = attempts[email];

        if (!userAttempts) return false;

        const now = Date.now();
        const timeSinceLastAttempt = now - userAttempts.lastAttempt;

        // إذا مرت فترة القفل، امسح المحاولات
        if (timeSinceLastAttempt > AUTH_CONFIG.LOCKOUT_DURATION) {
            this.clearFailedAttempts(email);
            return false;
        }

        return userAttempts.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS;
    }

    // تحديث آخر تسجيل دخول للمستخدم
    updateUserLastLogin(user) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            this.saveAllUsers(users);
        }
    }

    // الحصول على جميع المستخدمين
    getAllUsers() {
        return JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
    }

    // حفظ جميع المستخدمين
    saveAllUsers(users) {
        localStorage.setItem('fouad_academy_users', JSON.stringify(users));
    }

    // تسجيل أحداث الأمان
    logSecurityEvent(event, data) {
        const securityLogs = JSON.parse(localStorage.getItem('fouad_academy_security_logs') || '[]');
        
        securityLogs.push({
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'localhost' // في الإنتاج، احصل على IP الحقيقي
        });

        // الاحتفاظ بآخر 500 سجل فقط
        if (securityLogs.length > 500) {
            securityLogs.splice(0, securityLogs.length - 500);
        }

        localStorage.setItem('fouad_academy_security_logs', JSON.stringify(securityLogs));
    }

    // تغيير كلمة المرور
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        try {
            const users = this.getAllUsers();
            const user = users.find(u => u.id === this.currentUser.id);

            if (!user || !this.verifyPassword(currentPassword, user.password)) {
                return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
            }

            const passwordStrength = this.checkPasswordStrength(newPassword);
            if (!passwordStrength.isStrong) {
                return { success: false, message: passwordStrength.message };
            }

            // تحديث كلمة المرور
            user.password = this.hashPassword(newPassword);
            this.saveAllUsers(users);

            this.logSecurityEvent('password_changed', {
                userId: user.id,
                timestamp: new Date().toISOString()
            });

            return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };

        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' };
        }
    }

    // إعادة تعيين كلمة المرور (مبسط)
    async resetPassword(email) {
        try {
            const users = this.getAllUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                return { success: false, message: 'البريد الإلكتروني غير مسجل' };
            }

            // في التطبيق الحقيقي، ارسل بريد إلكتروني
            // هنا سنقوم بإنشاء كلمة مرور مؤقتة
            const tempPassword = this.generateTempPassword();
            user.password = this.hashPassword(tempPassword);
            user.mustChangePassword = true;
            
            this.saveAllUsers(users);

            this.logSecurityEvent('password_reset', {
                userId: user.id,
                email: user.email,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: `تم إرسال كلمة مرور مؤقتة: ${tempPassword}`,
                tempPassword: tempPassword
            };

        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' };
        }
    }

    // توليد كلمة مرور مؤقتة
    generateTempPassword() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // تحديث ملف المستخدم
    async updateProfile(profileData) {
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        try {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex === -1) {
                return { success: false, message: 'المستخدم غير موجود' };
            }

            // تحديث البيانات
            const allowedFields = ['name', 'phone', 'country', 'city', 'bio', 'interests'];
            allowedFields.forEach(field => {
                if (profileData[field] !== undefined) {
                    if (field === 'name') {
                        users[userIndex][field] = profileData[field];
                        this.currentUser[field] = profileData[field];
                    } else {
                        users[userIndex].profile[field] = profileData[field];
                    }
                }
            });

            this.saveAllUsers(users);
            
            // تحديث الجلسة
            const session = JSON.parse(localStorage.getItem('fouad_academy_session'));
            session.user = this.currentUser;
            localStorage.setItem('fouad_academy_session', JSON.stringify(session));

            return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };

        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء تحديث الملف الشخصي' };
        }
    }

    // حذف الحساب
    async deleteAccount(password) {
        if (!this.currentUser) {
            return { success: false, message: 'يجب تسجيل الدخول أولاً' };
        }

        try {
            const users = this.getAllUsers();
            const user = users.find(u => u.id === this.currentUser.id);

            if (!user || !this.verifyPassword(password, user.password)) {
                return { success: false, message: 'كلمة المرور غير صحيحة' };
            }

            // حذف المستخدم
            const updatedUsers = users.filter(u => u.id !== this.currentUser.id);
            this.saveAllUsers(updatedUsers);

            // مسح جميع البيانات المرتبطة
            this.clearUserData(this.currentUser.id);

            this.logSecurityEvent('account_deleted', {
                userId: this.currentUser.id,
                timestamp: new Date().toISOString()
            });

            // تسجيل خروج
            this.clearSession();

            return { success: true, message: 'تم حذف الحساب بنجاح' };

        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء حذف الحساب' };
        }
    }

    // مسح بيانات المستخدم
    clearUserData(userId) {
        // مسح المفضلة
        localStorage.removeItem(`fouad_academy_favorites_${userId}`);
        
        // مسح الإعدادات
        const preferences = JSON.parse(localStorage.getItem('fouad_academy_preferences') || '{}');
        delete preferences[userId];
        localStorage.setItem('fouad_academy_preferences', JSON.stringify(preferences));

        // مسح الأنشطة
        const activities = JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]');
        const filteredActivities = activities.filter(activity => activity.userId !== userId);
        localStorage.setItem('fouad_academy_activities', JSON.stringify(filteredActivities));
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من الدور
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // التحقق من الصلاحية
    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            admin: ['manage_users', 'manage_courses', 'view_analytics', 'manage_payments'],
            student: ['view_courses', 'enroll_courses', 'view_profile']
        };

        return permissions[this.currentUser.role]?.includes(permission) || false;
    }
}

// إنشاء مثيل وحيد من مدير المصادقة
const authManager = new AuthManager();

// تصدير للنطاق العام
window.authManager = authManager;

// ربط الوظائف بالنطاق العام للتوافق مع الكود الموجود
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const result = await authManager.login(email, password);
    
    if (result.success) {
        window.showNotification(result.message, 'success');
        window.closeAuthModal();
        window.updateNavigationState();
        
        // إعادة التوجيه حسب الدور
        if (authManager.hasRole('admin')) {
            setTimeout(() => window.goToDashboard(), 1500);
        }
    } else {
        window.showNotification(result.message, 'error');
    }
};

window.handleRegister = async function(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('registerName').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('registerConfirmPassword').value
    };
    
    const result = await authManager.register(userData);
    
    if (result.success) {
        window.showNotification(result.message, 'success');
        window.closeAuthModal();
        window.updateNavigationState();
    } else {
        window.showNotification(result.message, 'error');
    }
};

window.logout = function() {
    const result = authManager.logout();
    window.showNotification(result.message, 'info');
    window.updateNavigationState();
    
    setTimeout(() => {
        window.location.reload();
    }, 1500);
};

// تحديث المتغير العام للمستخدم الحالي
window.currentUser = authManager.getCurrentUser();

// مراقبة تحديثات المستخدم
setInterval(() => {
    window.currentUser = authManager.getCurrentUser();
}, 1000);

console.log('تم تحميل نظام المصادقة المتقدم بنجاح ✅');
