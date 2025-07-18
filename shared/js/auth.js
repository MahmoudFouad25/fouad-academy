// استبدل محتوى ملف shared/js/auth.js بهذا الكود المُصحح

class FouadAcademyAuth {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.db = null;
        this.googleProvider = null;
        this.isFirebaseReady = false;
        
        // Admin emails
        this.ADMIN_EMAILS = [
            "coach.mahmoud.fouad@gmail.com",
            "enneagram.compass@gmail.com", 
            "mahmoudfouad25@gmail.com"
        ];
        
        this.initializeFirebase();
    }

    // تهيئة Firebase مع تأخير للتأكد من التحميل
    async initializeFirebase() {
        console.log('🔧 بدء تهيئة Firebase...');
        
        // انتظار تحميل Firebase
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkFirebase = () => {
            attempts++;
            console.log(`محاولة ${attempts}: فحص Firebase...`);
            
            if (window.firebaseApp && window.firebaseAuth && window.firebaseDb) {
                this.auth = window.firebaseAuth;
                this.db = window.firebaseDb;
                this.isFirebaseReady = true;
                
                this.setupGoogleProvider();
                this.setupAuthListener();
                this.bindEvents();
                this.updateUI();
                
                console.log('✅ Firebase تم تحميله بنجاح!');
                this.showNotification('🔥 Firebase متصل', 'success');
                
            } else if (attempts < maxAttempts) {
                console.log('⏳ انتظار Firebase...');
                setTimeout(checkFirebase, 500);
            } else {
                console.error('❌ فشل في تحميل Firebase');
                this.showNotification('⚠️ خدمة Google غير متاحة', 'error');
                this.setupFallbackAuth();
            }
        };
        
        // بدء الفحص بعد ثانية
        setTimeout(checkFirebase, 1000);
    }

    // إعداد Google Provider
    setupGoogleProvider() {
        try {
            // استخدام GoogleAuthProvider من النطاق العام
            if (window.firebaseAuthFunctions && window.firebaseAuthFunctions.GoogleAuthProvider) {
                this.googleProvider = new window.firebaseAuthFunctions.GoogleAuthProvider();
                this.googleProvider.addScope('email');
                this.googleProvider.addScope('profile');
                console.log('✅ Google Provider جاهز');
            } else {
                console.error('❌ GoogleAuthProvider غير متاح');
            }
        } catch (error) {
            console.error('❌ خطأ في إعداد Google Provider:', error);
        }
    }

    // إعداد مراقب المصادقة
    setupAuthListener() {
        if (!this.auth) return;
        
        try {
            const { onAuthStateChanged } = window.firebaseAuthFunctions || {};
            
            if (onAuthStateChanged) {
                onAuthStateChanged(this.auth, async (user) => {
                    if (user) {
                        await this.handleUserSignIn(user);
                    } else {
                        this.handleUserSignOut();
                    }
                });
                console.log('✅ Auth Listener جاهز');
            }
        } catch (error) {
            console.error('❌ خطأ في Auth Listener:', error);
        }
    }

    // معالجة تسجيل دخول المستخدم
    async handleUserSignIn(user) {
        try {
            console.log('🔥 مستخدم دخل:', user.email);
            
            // إنشاء/تحديث مستند المستخدم
            await this.createOrUpdateUserDoc(user);
            
            // تحديث المستخدم الحالي
            this.currentUser = {
                id: user.uid,
                name: user.displayName || 'مستخدم',
                email: user.email,
                avatar: user.photoURL,
                role: this.ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'student',
                provider: user.providerData[0]?.providerId || 'email'
            };

            this.updateUI();
            this.showNotification(`مرحباً ${this.currentUser.name}!`, 'success');
            this.closeAuthModal();

            // انتقال للآدمن إذا لزم الأمر
            if (this.currentUser.role === 'admin' && this.shouldRedirectToAdmin()) {
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1500);
            }

        } catch (error) {
            console.error('خطأ في معالجة تسجيل الدخول:', error);
            this.showNotification('حدث خطأ في تسجيل الدخول', 'error');
        }
    }

    // معالجة تسجيل الخروج
    handleUserSignOut() {
        console.log('👋 تم تسجيل الخروج');
        this.currentUser = null;
        this.updateUI();
    }

    // التحقق من ضرورة إعادة التوجيه للآدمن
    shouldRedirectToAdmin() {
        const currentPath = window.location.pathname;
        return currentPath === '/' || 
               currentPath.includes('index.html') || 
               currentPath === '';
    }

    // إنشاء أو تحديث مستند المستخدم
    async createOrUpdateUserDoc(user) {
        if (!this.db) return;

        try {
            const { doc, setDoc, getDoc, updateDoc } = window.firebaseFirestoreFunctions || {};
            
            if (!doc || !setDoc || !getDoc || !updateDoc) {
                console.log('⚠️ Firestore functions غير متاحة');
                return;
            }

            const userRef = doc(this.db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            const userData = {
                uid: user.uid,
                name: user.displayName || 'مستخدم جديد',
                email: user.email,
                avatar: user.photoURL || null,
                lastLogin: new Date().toISOString(),
                isAdmin: this.ADMIN_EMAILS.includes(user.email.toLowerCase())
            };

            if (!userDoc.exists()) {
                userData.joinDate = new Date().toISOString();
                userData.enrolledCourses = [1];
                await setDoc(userRef, userData);
                console.log('👤 تم إنشاء مستخدم جديد');
            } else {
                await updateDoc(userRef, {
                    lastLogin: userData.lastLogin,
                    avatar: userData.avatar
                });
                console.log('🔄 تم تحديث بيانات المستخدم');
            }
        } catch (error) {
            console.error('خطأ في إنشاء/تحديث مستند المستخدم:', error);
        }
    }

    // تسجيل دخول Google
    async loginWithGoogle() {
        console.log('🌐 محاولة تسجيل دخول Google...');
        console.log('Firebase Ready:', this.isFirebaseReady);
        console.log('Google Provider:', !!this.googleProvider);
        console.log('Auth:', !!this.auth);
        
        if (!this.isFirebaseReady) {
            this.showNotification('⚠️ Firebase غير متصل. جاري إعادة المحاولة...', 'warning');
            // إعادة محاولة تهيئة Firebase
            await this.initializeFirebase();
            return;
        }

        if (!this.googleProvider) {
            this.showNotification('❌ Google Provider غير متاح', 'error');
            return;
        }

        try {
            this.showNotification('🌐 جاري فتح نافذة Google...', 'info');

            const { signInWithPopup } = window.firebaseAuthFunctions || {};
            if (!signInWithPopup) {
                throw new Error('signInWithPopup غير متاح');
            }

            console.log('🚀 بدء signInWithPopup...');
            const result = await signInWithPopup(this.auth, this.googleProvider);
            console.log('✅ تم تسجيل الدخول بـ Google:', result.user.email);
            
        } catch (error) {
            console.error('❌ خطأ تفصيلي في Google:', error);
            
            const errorMessages = {
                'auth/popup-closed-by-user': 'تم إغلاق نافذة Google',
                'auth/popup-blocked': 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة في المتصفح',
                'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
                'auth/internal-error': 'خطأ داخلي في خدمة Google',
                'auth/unauthorized-domain': 'النطاق غير مصرح له'
            };

            const errorMessage = errorMessages[error.code] || `خطأ في Google: ${error.message}`;
            this.showNotification(errorMessage, 'error');
        }
    }

    // تسجيل دخول بالبريد الإلكتروني
    async loginWithEmail(email, password) {
        if (!this.isFirebaseReady) {
            this.showNotification('⚠️ خدمة المصادقة غير متاحة', 'error');
            return;
        }

        try {
            const { signInWithEmailAndPassword } = window.firebaseAuthFunctions || {};
            if (!signInWithEmailAndPassword) {
                throw new Error('signInWithEmailAndPassword غير متاح');
            }
            
            await signInWithEmailAndPassword(this.auth, email, password);
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            
            const errorMessages = {
                'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
                'auth/wrong-password': 'كلمة المرور غير صحيحة',
                'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
                'auth/too-many-requests': 'تم تجاوز عدد المحاولات. حاول لاحقاً'
            };

            const errorMessage = errorMessages[error.code] || 'حدث خطأ في تسجيل الدخول';
            this.showNotification(errorMessage, 'error');
            throw error;
        }
    }

    // التسجيل بالبريد الإلكتروني
    async registerWithEmail(name, email, password) {
        if (!this.isFirebaseReady) {
            this.showNotification('⚠️ خدمة المصادقة غير متاحة', 'error');
            return;
        }

        try {
            const { createUserWithEmailAndPassword, updateProfile } = window.firebaseAuthFunctions || {};
            if (!createUserWithEmailAndPassword || !updateProfile) {
                throw new Error('Firebase functions غير متاحة');
            }
            
            const result = await createUserWithEmailAndPassword(this.auth, email, password);
            await updateProfile(result.user, { displayName: name });
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء الحساب:', error);
            
            const errorMessages = {
                'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
                'auth/weak-password': 'كلمة المرور ضعيفة جداً',
                'auth/invalid-email': 'البريد الإلكتروني غير صحيح'
            };

            const errorMessage = errorMessages[error.code] || 'حدث خطأ في إنشاء الحساب';
            this.showNotification(errorMessage, 'error');
            throw error;
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            if (this.isFirebaseReady) {
                const { signOut } = window.firebaseAuthFunctions || {};
                if (signOut) {
                    await signOut(this.auth);
                }
            }
            
            this.showNotification('تم تسجيل الخروج بنجاح', 'success');
            
            if (window.location.pathname.includes('admin/')) {
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }
            
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            this.showNotification('حدث خطأ في تسجيل الخروج', 'error');
        }
    }

    // ربط الأحداث
    bindEvents() {
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleLoginSubmit();
            };
        }

        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleRegisterSubmit();
            };
        }
    }

    // معالجة تسجيل الدخول
    async handleLoginSubmit() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        try {
            await this.loginWithEmail(email, password);
        } catch (error) {
            // الخطأ تم التعامل معه
        }
    }

    // معالجة التسجيل
    async handleRegisterSubmit() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
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

        try {
            await this.registerWithEmail(name, email, password);
        } catch (error) {
            // الخطأ تم التعامل معه
        }
    }

    // تحديث واجهة المستخدم
    updateUI() {
        const navAuth = document.querySelector('.nav-auth');
        if (!navAuth) return;

        if (this.currentUser) {
            navAuth.innerHTML = `
                <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
                    ${this.currentUser.avatar ? 
                        `<img src="${this.currentUser.avatar}" alt="صورة المستخدم" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : 
                        `<div style="width: 32px; height: 32px; background: linear-gradient(45deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem;">${this.currentUser.name.charAt(0).toUpperCase()}</div>`
                    }
                    <span style="color: var(--text-primary); font-weight: 500;">مرحباً، ${this.currentUser.name}</span>
                    <button class="btn btn-outline" onclick="fouadAuth.goToDashboard()">
                        ${this.currentUser.role === 'admin' ? 'لوحة الإدارة' : 'لوحتي'}
                    </button>
                    <button class="btn btn-primary" onclick="fouadAuth.logout()">خروج</button>
                </div>
            `;
        } else {
            navAuth.innerHTML = `
                <button class="btn btn-outline" onclick="fouadAuth.showLogin()">تسجيل الدخول</button>
                <button class="btn btn-primary" onclick="fouadAuth.showRegister()">انضم الآن</button>
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
            
            setTimeout(() => this.addGoogleButton(), 200);
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
            
            setTimeout(() => this.addGoogleButton(), 200);
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

    // إضافة زر Google
    addGoogleButton() {
        document.querySelectorAll('.google-auth-btn').forEach(btn => btn.remove());

        const forms = ['loginForm', 'registerForm'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                const googleBtn = document.createElement('button');
                googleBtn.type = 'button';
                googleBtn.className = 'btn btn-primary btn-full google-auth-btn';
                googleBtn.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        ${this.isFirebaseReady ? 'تسجيل الدخول بـ Google' : 'Google غير متاح'}
                    </div>
                `;
                googleBtn.style.cssText = `
                    background: ${this.isFirebaseReady ? '#fff' : '#f5f5f5'} !important;
                    color: ${this.isFirebaseReady ? '#333' : '#999'} !important;
                    border: 1px solid ${this.isFirebaseReady ? '#dadce0' : '#ddd'} !important;
                    margin-top: 15px;
                    font-weight: 500;
                    ${this.isFirebaseReady ? 'cursor: pointer;' : 'cursor: not-allowed;'}
                `;
                
                if (this.isFirebaseReady) {
                    googleBtn.onclick = () => this.loginWithGoogle();
                } else {
                    googleBtn.onclick = () => this.showNotification('⚠️ Firebase غير متصل', 'warning');
                }
                
                form.appendChild(googleBtn);
            }
        });
    }

    // إعداد النظام الاحتياطي
    setupFallbackAuth() {
        console.log('⚠️ إعداد النظام الاحتياطي');
        this.isFirebaseReady = false;
        this.updateUI();
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            max-width: 400px;
            font-size: 0.95rem;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // الوظائف المساعدة
    getCurrentUser() { return this.currentUser; }
    hasRole(role) { return this.currentUser && this.currentUser.role === role; }
}

// إنشاء مثيل النظام
const fouadAuth = new FouadAcademyAuth();

// ربط بالنطاق العام
window.fouadAuth = fouadAuth;
window.currentUser = fouadAuth.getCurrentUser();
window.showLogin = () => fouadAuth.showLogin();
window.showRegister = () => fouadAuth.showRegister();
window.closeAuthModal = () => fouadAuth.closeAuthModal();
window.switchToLogin = () => fouadAuth.showLogin();
window.switchToRegister = () => fouadAuth.showRegister();
window.logout = () => fouadAuth.logout();
window.updateNavigationState = () => fouadAuth.updateUI();
window.goToDashboard = () => fouadAuth.goToDashboard();
window.loginWithGoogle = () => fouadAuth.loginWithGoogle();
window.handleLogin = () => fouadAuth.handleLoginSubmit();
window.handleRegister = () => fouadAuth.handleRegisterSubmit();

console.log('✅ نظام المصادقة جاهز!');
