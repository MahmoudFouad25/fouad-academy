// حل شامل لجميع مشاكل تسجيل الدخول
// أضف هذا الكود في نهاية ملف shared/js/auth.js واستبدل كل الكود الموجود

// إعادة كتابة كاملة لنظام المصادقة
class FixedAuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('🔧 تهيئة نظام المصادقة المُصحح...');
        
        // تحميل الجلسة
        this.loadSession();
        
        // إنشاء حسابات تجريبية
        this.createTestAccounts();
        
        // ربط الأحداث
        this.bindEvents();
        
        // تحديث الواجهة
        this.updateUI();
    }

    // إنشاء حسابات تجريبية
    createTestAccounts() {
        const testUsers = [
            {
                id: 'admin_main',
                name: 'محمود فؤاد',
                email: 'admin@test.com',
                password: '123456',
                role: 'admin',
                joinDate: new Date().toISOString(),
                enrolledCourses: [1, 2, 3]
            },
            {
                id: 'student_test',
                name: 'طالب تجريبي',
                email: 'student@test.com', 
                password: '123456',
                role: 'student',
                joinDate: new Date().toISOString(),
                enrolledCourses: [1]
            }
        ];

        const existingUsers = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
        
        testUsers.forEach(user => {
            const exists = existingUsers.find(u => u.email === user.email);
            if (!exists) {
                existingUsers.push(user);
            }
        });

        localStorage.setItem('fouad_academy_users', JSON.stringify(existingUsers));
        
        console.log('✅ تم إنشاء الحسابات التجريبية:');
        console.log('🔑 آدمن: admin@test.com / 123456');
        console.log('🔑 طالب: student@test.com / 123456');
    }

    // تحميل الجلسة
    loadSession() {
        const session = localStorage.getItem('fouad_academy_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.user) {
                    this.currentUser = sessionData.user;
                    console.log('✅ تم تحميل جلسة المستخدم:', this.currentUser.name);
                }
            } catch (error) {
                console.error('خطأ في تحميل الجلسة:', error);
                this.clearSession();
            }
        }
    }

    // حفظ الجلسة
    saveSession(user) {
        const sessionData = {
            user: user,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('fouad_academy_session', JSON.stringify(sessionData));
        this.currentUser = user;
    }

    // مسح الجلسة
    clearSession() {
        localStorage.removeItem('fouad_academy_session');
        this.currentUser = null;
    }

    // ربط الأحداث
    bindEvents() {
        // تسجيل الدخول العادي
        this.bindLoginForm();
        
        // التسجيل
        this.bindRegisterForm();
        
        // إضافة أزرار Google
        this.addGoogleButtons();
        
        // إضافة أزرار اختبار
        this.addTestButtons();
    }

    // ربط نموذج تسجيل الدخول
    bindLoginForm() {
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    // ربط نموذج التسجيل
    bindRegisterForm() {
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    // معالجة تسجيل الدخول
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        console.log('🔐 محاولة تسجيل دخول:', email);

        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        // البحث عن المستخدم
        const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.saveSession(user);
            this.showNotification(`مرحباً بك، ${user.name}!`, 'success');
            this.closeAuthModal();
            this.updateUI();

            // الانتقال حسب الدور
            if (user.role === 'admin') {
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1000);
            }
        } else {
            this.showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        }
    }

    // معالجة التسجيل
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        console.log('📝 محاولة تسجيل جديد:', email);

        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('كلمة المرور وتأكيدها غير متطابقتين', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        // التحقق من وجود المستخدم
        const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showNotification('البريد الإلكتروني مستخدم بالفعل', 'error');
            return;
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            password: password,
            role: 'student',
            joinDate: new Date().toISOString(),
            enrolledCourses: [1] // دورة مجانية
        };

        users.push(newUser);
        localStorage.setItem('fouad_academy_users', JSON.stringify(users));

        this.saveSession(newUser);
        this.showNotification(`مرحباً بك، ${name}! تم منحك دورة مجانية`, 'success');
        this.closeAuthModal();
        this.updateUI();
    }

    // تسجيل دخول Google (محاكاة)
    async loginWithGoogle() {
        console.log('🌐 بدء تسجيل دخول Google...');
        
        this.showNotification('جاري الاتصال بـ Google...', 'info');

        // محاكاة تأخير الشبكة
        setTimeout(() => {
            const googleAccounts = [
                { name: 'محمود فؤاد', email: 'coach.mahmoud.fouad@gmail.com', role: 'admin' },
                { name: 'مستخدم Google', email: 'user@gmail.com', role: 'student' }
            ];

            const selectedAccount = googleAccounts[Math.floor(Math.random() * googleAccounts.length)];

            const googleUser = {
                id: 'google_' + Date.now(),
                name: selectedAccount.name,
                email: selectedAccount.email,
                role: selectedAccount.role,
                joinDate: new Date().toISOString(),
                enrolledCourses: [1],
                provider: 'google'
            };

            // حفظ المستخدم
            const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
            const existingUser = users.find(u => u.email === googleUser.email);
            
            if (!existingUser) {
                users.push(googleUser);
                localStorage.setItem('fouad_academy_users', JSON.stringify(users));
            }

            this.saveSession(googleUser);
            this.showNotification(`مرحباً ${googleUser.name}! تم تسجيل الدخول بـ Google`, 'success');
            this.closeAuthModal();
            this.updateUI();

            if (googleUser.role === 'admin') {
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1000);
            }
        }, 2000);
    }

    // إضافة أزرار Google
    addGoogleButtons() {
        // زر Google لتسجيل الدخول
        setTimeout(() => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm && !loginForm.querySelector('.google-btn')) {
                const googleBtn = this.createGoogleButton('تسجيل الدخول بـ Google');
                googleBtn.onclick = () => this.loginWithGoogle();
                loginForm.appendChild(googleBtn);
            }

            const registerForm = document.getElementById('registerForm');
            if (registerForm && !registerForm.querySelector('.google-btn')) {
                const googleBtn = this.createGoogleButton('إنشاء حساب بـ Google');
                googleBtn.onclick = () => this.loginWithGoogle();
                registerForm.appendChild(googleBtn);
            }
        }, 100);
    }

    // إنشاء زر Google
    createGoogleButton(text) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary btn-full google-btn';
        btn.innerHTML = `🌐 ${text}`;
        btn.style.cssText = `
            background: linear-gradient(45deg, #db4437, #c23321) !important;
            margin-top: 15px;
            color: white;
            border: none;
            font-weight: bold;
        `;
        return btn;
    }

    // إضافة أزرار اختبار سريع
    addTestButtons() {
        setTimeout(() => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm && !loginForm.querySelector('.test-buttons')) {
                const testContainer = document.createElement('div');
                testContainer.className = 'test-buttons';
                testContainer.style.cssText = 'margin-top: 15px; text-align: center;';
                
                testContainer.innerHTML = `
                    <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">🚀 دخول سريع للاختبار:</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="button" class="btn btn-success btn-small" onclick="authManager.quickLogin('admin')">
                            دخول كآدمن
                        </button>
                        <button type="button" class="btn btn-outline btn-small" onclick="authManager.quickLogin('student')">
                            دخول كطالب
                        </button>
                    </div>
                `;
                
                loginForm.appendChild(testContainer);
            }
        }, 200);
    }

    // دخول سريع للاختبار
    quickLogin(type) {
        const testAccounts = {
            admin: {
                id: 'admin_quick',
                name: 'محمود فؤاد (آدمن)',
                email: 'admin@test.com',
                role: 'admin',
                joinDate: new Date().toISOString(),
                enrolledCourses: [1, 2, 3]
            },
            student: {
                id: 'student_quick',
                name: 'طالب تجريبي',
                email: 'student@test.com',
                role: 'student',
                joinDate: new Date().toISOString(),
                enrolledCourses: [1]
            }
        };

        const user = testAccounts[type];
        if (user) {
            this.saveSession(user);
            this.showNotification(`تم الدخول كـ ${user.name}`, 'success');
            this.closeAuthModal();
            this.updateUI();

            if (type === 'admin') {
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1000);
            }
        }
    }

    // تسجيل الخروج
    logout() {
        this.clearSession();
        this.showNotification('تم تسجيل الخروج بنجاح', 'info');
        this.updateUI();
        
        // العودة للصفحة الرئيسية إذا كان في صفحة إدارية
        if (window.location.pathname.includes('admin/')) {
            window.location.href = '../index.html';
        } else {
            window.location.reload();
        }
    }

    // تحديث واجهة المستخدم
    updateUI() {
        const navAuth = document.querySelector('.nav-auth');
        if (!navAuth) return;

        if (this.currentUser) {
            navAuth.innerHTML = `
                <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
                    <span>مرحباً، ${this.currentUser.name}</span>
                    <button class="btn btn-outline" onclick="authManager.goToDashboard()">
                        ${this.currentUser.role === 'admin' ? 'لوحة الإدارة' : 'لوحتي'}
                    </button>
                    <button class="btn btn-primary" onclick="authManager.logout()">خروج</button>
                </div>
            `;
        } else {
            navAuth.innerHTML = `
                <button class="btn btn-outline" onclick="authManager.showLogin()">تسجيل الدخول</button>
                <button class="btn btn-primary" onclick="authManager.showRegister()">انضم الآن</button>
            `;
        }
    }

    // عرض نافذة تسجيل الدخول
    showLogin() {
        const modal = document.getElementById('authModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (modal && loginForm && registerForm) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            modal.classList.add('show');
            
            // إضافة الأزرار
            setTimeout(() => {
                this.addGoogleButtons();
                this.addTestButtons();
            }, 100);
            
            // تركيز على حقل البريد
            setTimeout(() => {
                const emailField = document.getElementById('loginEmail');
                if (emailField) emailField.focus();
            }, 300);
        }
    }

    // عرض نافذة التسجيل
    showRegister() {
        const modal = document.getElementById('authModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (modal && loginForm && registerForm) {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            modal.classList.add('show');
            
            // إضافة الأزرار
            setTimeout(() => {
                this.addGoogleButtons();
            }, 100);
            
            // تركيز على حقل الاسم
            setTimeout(() => {
                const nameField = document.getElementById('registerName');
                if (nameField) nameField.focus();
            }, 300);
        }
    }

    // إغلاق نافذة المصادقة
    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // الانتقال للوحة التحكم
    goToDashboard() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        
        if (this.currentUser.role === 'admin') {
            window.location.href = 'admin/dashboard.html';
        } else {
            this.showNotification('لوحة الطالب ستكون متاحة قريباً', 'info');
        }
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // إنشاء إشعار بصري
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-weight: 500;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // إزالة بعد 4 ثوان
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // ألوان الإشعارات
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    // التحقق من الدور
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }
}

// إنشاء مثيل جديد من النظام المُصحح
const authManager = new FixedAuthManager();

// ربط بالنطاق العام
window.authManager = authManager;
window.currentUser = authManager.getCurrentUser();

// ربط الوظائف للتوافق مع HTML
window.showLogin = () => authManager.showLogin();
window.showRegister = () => authManager.showRegister();
window.closeAuthModal = () => authManager.closeAuthModal();
window.switchToLogin = () => authManager.showLogin();
window.switchToRegister = () => authManager.showRegister();
window.logout = () => authManager.logout();
window.updateNavigationState = () => authManager.updateUI();
window.goToDashboard = () => authManager.goToDashboard();
window.loginWithGoogle = () => authManager.loginWithGoogle();

// تحديث واجهة المستخدم عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    authManager.updateUI();
    console.log('✅ تم تحميل نظام المصادقة المُصحح بنجاح!');
});

console.log('🔧 نظام المصادقة الجديد جاهز للاستخدام!');
