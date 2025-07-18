// منصة الفؤاد التعليمية - الوظائف الأساسية

// المتغيرات الأساسية
let currentUser = null;
let courses = [];
let isLoading = true;

// البيانات الافتراضية للدورات
const defaultCourses = [
    {
        id: 1,
        title: "ملاذ الحيارى - الاستيقاظ",
        description: "خريطة البحث عن المأوى للقلوب التائهة - رحلة من 7 لقاءات لاكتشاف الذات وإزالة الران عن الفطرة",
        price: 0,
        instructor: "محمود فؤاد",
        level: "مبتدئ",
        duration: "7 لقاءات",
        image: "📚",
        students: 1200,
        rating: 4.9,
        status: "active",
        isFree: true
    },
    {
        id: 2,
        title: "منظور الفؤاد - الأساسيات",
        description: "فهم البنية الرباعية للنفس الإنسانية والأشواق التسعة المودعة في الفطرة",
        price: 499,
        instructor: "محمود فؤاد",
        level: "متوسط",
        duration: "12 درس",
        image: "🧠",
        students: 850,
        rating: 4.8,
        status: "active",
        isFree: false
    },
    {
        id: 3,
        title: "مكارم الأخلاق العملية",
        description: "رحلة تطبيقية لتحقيق مكارم الأخلاق في الحياة اليومية وفق مراد الله",
        price: 699,
        instructor: "محمود فؤاد",
        level: "متقدم",
        duration: "15 درس",
        image: "⭐",
        students: 650,
        rating: 4.9,
        status: "active",
        isFree: false
    }
];

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل منصة الفؤاد التعليمية');
    
    // تهيئة البيانات
    initializeApp();
    
    // ربط الأحداث
    bindEvents();
    
    // إخفاء شاشة التحميل
    setTimeout(hideLoadingScreen, 1500);
});

// تهيئة التطبيق
function initializeApp() {
    // تحميل البيانات من التخزين المحلي
    loadUserSession();
    loadCoursesData();
    
    // عرض الدورات في الصفحة الرئيسية
    displayFeaturedCourses();
    
    // تحديث واجهة المستخدم
    updateNavigationState();
    
    // تهيئة العدادات المتحركة
    initializeCounters();
}

// ربط الأحداث
function bindEvents() {
    // أحداث النماذج
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    const contactForm = document.getElementById('contactForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // أحداث النقر خارج النافذة المنبثقة
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            closeAuthModal();
        }
    });
    
    // أحداث التمرير
    window.addEventListener('scroll', handleScroll);
    
    // أحداث تغيير حجم النافذة
    window.addEventListener('resize', handleResize);
}

// إخفاء شاشة التحميل
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// تحميل جلسة المستخدم
function loadUserSession() {
    const savedUser = localStorage.getItem('fouad_academy_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('تم تحميل بيانات المستخدم:', currentUser.name);
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
            localStorage.removeItem('fouad_academy_user');
        }
    }
}

// تحميل بيانات الدورات
function loadCoursesData() {
    const savedCourses = localStorage.getItem('fouad_academy_courses');
    if (savedCourses) {
        try {
            courses = JSON.parse(savedCourses);
        } catch (error) {
            console.error('خطأ في تحميل بيانات الدورات:', error);
            courses = [...defaultCourses];
        }
    } else {
        courses = [...defaultCourses];
        saveCoursesData();
    }
}

// حفظ بيانات الدورات
function saveCoursesData() {
    localStorage.setItem('fouad_academy_courses', JSON.stringify(courses));
}

// عرض الدورات المميزة
function displayFeaturedCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    if (!coursesGrid) return;
    
    // أخذ أول 3 دورات
    const featuredCourses = courses.slice(0, 3);
    
    coursesGrid.innerHTML = featuredCourses.map(course => createCourseCard(course)).join('');
}

// إنشاء بطاقة دورة
function createCourseCard(course) {
    const priceDisplay = course.isFree ? 'مجاني' : `${course.price} جنيه`;
    const enrollButton = currentUser ? 
        `<button class="btn btn-primary" onclick="enrollInCourse(${course.id})">
            ${course.isFree ? 'ابدأ الآن' : 'اشترك الآن'}
         </button>` :
        `<button class="btn btn-primary" onclick="showLogin()">سجل للوصول</button>`;
    
    return `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-image">
                ${course.image}
            </div>
            <h3 class="course-title">${course.title}</h3>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span>👨‍🏫 ${course.instructor}</span>
                <span>📊 ${course.level}</span>
                <span>⏱️ ${course.duration}</span>
            </div>
            <div class="course-footer">
                <div class="course-price">${priceDisplay}</div>
                <div class="course-stats">
                    <span>⭐ ${course.rating}</span>
                    <span>👥 ${course.students} طالب</span>
                </div>
                ${enrollButton}
            </div>
        </div>
    `;
}

// تحديث حالة التنقل
function updateNavigationState() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;
    
    if (currentUser) {
        navAuth.innerHTML = `
            <div class="user-info">
                <span>مرحباً، ${currentUser.name}</span>
                <button class="btn btn-outline" onclick="goToDashboard()">لوحة التحكم</button>
                <button class="btn btn-primary" onclick="logout()">خروج</button>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <button class="btn btn-outline" onclick="showLogin()">تسجيل الدخول</button>
            <button class="btn btn-primary" onclick="showRegister()">انضم الآن</button>
        `;
    }
}

// تهيئة العدادات المتحركة
function initializeCounters() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.stat-number').forEach(counter => {
        observer.observe(counter);
    });
}

// تحريك العداد
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 40);
}

// عرض نافذة تسجيل الدخول
function showLogin() {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    modal.classList.add('show');
    
    // تركيز على حقل البريد الإلكتروني
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 300);
}

// عرض نافذة التسجيل
function showRegister() {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    modal.classList.add('show');
    
    // تركيز على حقل الاسم
    setTimeout(() => {
        document.getElementById('registerName').focus();
    }, 300);
}

// إغلاق نافذة المصادقة
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('show');
}

// التبديل إلى تسجيل الدخول
function switchToLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    
    document.getElementById('loginEmail').focus();
}

// التبديل إلى التسجيل
function switchToRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    
    document.getElementById('registerName').focus();
}

// معالجة تسجيل الدخول
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // التحقق من بيانات المستخدم (مؤقتاً من التخزين المحلي)
    const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'student',
            joinDate: user.joinDate,
            enrolledCourses: user.enrolledCourses || []
        };
        
        // حفظ جلسة المستخدم
        localStorage.setItem('fouad_academy_user', JSON.stringify(currentUser));
        
        showNotification(`مرحباً بك، ${currentUser.name}!`, 'success');
        closeAuthModal();
        updateNavigationState();
        
        // إعادة توجيه للوحة التحكم إذا كان مدير
        if (currentUser.role === 'admin') {
            setTimeout(() => goToDashboard(), 1500);
        }
        
    } else {
        showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

// معالجة التسجيل
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // التحقق من البيانات
    if (!name || !email || !password || !confirmPassword) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمة المرور وتأكيدها غير متطابقتين', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // التحقق من عدم وجود المستخدم مسبقاً
    const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
    if (users.find(u => u.email === email)) {
        showNotification('البريد الإلكتروني مستخدم بالفعل', 'error');
        return;
    }
    
    // إنشاء المستخدم الجديد
    const newUser = {
        id: generateUserId(),
        name: name,
        email: email,
        password: password, // في التطبيق الحقيقي، يجب تشفير كلمة المرور
        role: email === 'coach.mahmoud.fouad@gmail.com' ? 'admin' : 'student',
        joinDate: new Date().toISOString(),
        enrolledCourses: [1], // إعطاء الدورة المجانية تلقائياً
        lastLogin: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('fouad_academy_users', JSON.stringify(users));
    
    // تسجيل دخول المستخدم تلقائياً
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        joinDate: newUser.joinDate,
        enrolledCourses: newUser.enrolledCourses
    };
    
    localStorage.setItem('fouad_academy_user', JSON.stringify(currentUser));
    
    showNotification(`مرحباً بك في المنصة، ${currentUser.name}! تم منحك دورة "ملاذ الحيارى" مجاناً`, 'success');
    closeAuthModal();
    updateNavigationState();
}

// توليد معرف فريد للمستخدم
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// تسجيل الخروج
function logout() {
    currentUser = null;
    localStorage.removeItem('fouad_academy_user');
    updateNavigationState();
    showNotification('تم تسجيل الخروج بنجاح', 'info');
    
    // إعادة تحميل الصفحة للعودة للحالة الأولية
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// الانتقال للوحة التحكم
function goToDashboard() {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    if (currentUser.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
    } else {
        window.location.href = 'student/dashboard.html';
    }
}

// الاشتراك في دورة
function enrollInCourse(courseId) {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        showNotification('الدورة غير موجودة', 'error');
        return;
    }
    
    // التحقق من الاشتراك المسبق
    if (currentUser.enrolledCourses.includes(courseId)) {
        showNotification('أنت مشترك في هذه الدورة بالفعل', 'info');
        goToDashboard();
        return;
    }
    
    if (course.isFree) {
        // اشتراك مجاني فوري
        enrollUserInCourse(courseId);
    } else {
        // توجيه لصفحة الدفع
        window.location.href = `payment.html?course=${courseId}`;
    }
}

// اشتراك المستخدم في الدورة
function enrollUserInCourse(courseId) {
    currentUser.enrolledCourses.push(courseId);
    
    // تحديث البيانات في التخزين المحلي
    localStorage.setItem('fouad_academy_user', JSON.stringify(currentUser));
    
    const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].enrolledCourses = currentUser.enrolledCourses;
        localStorage.setItem('fouad_academy_users', JSON.stringify(users));
    }
    
    const course = courses.find(c => c.id === courseId);
    showNotification(`تم اشتراكك في دورة "${course.title}" بنجاح!`, 'success');
    
    // تحديث عرض الدورات
    displayFeaturedCourses();
}

// عرض جميع الدورات
function showAllCourses() {
    window.location.href = 'courses.html';
}

// التمرير إلى قسم معين
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// معالجة التمرير
function handleScroll() {
    const nav = document.querySelector('.main-nav');
    if (window.scrollY > 100) {
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.95)';
        nav.style.boxShadow = 'none';
    }
}

// معالجة تغيير حجم النافذة
function handleResize() {
    // إعادة تعيين أي عناصر تحتاج تحديث عند تغيير الحجم
    console.log('تم تغيير حجم النافذة:', window.innerWidth);
}

// معالجة نموذج التواصل
function handleContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !email || !message) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // حفظ الرسالة (مؤقتاً في التخزين المحلي)
    const messages = JSON.parse(localStorage.getItem('fouad_academy_messages') || '[]');
    messages.push({
        id: generateUserId(),
        name: name,
        email: email,
        message: message,
        date: new Date().toISOString(),
        status: 'unread'
    });
    localStorage.setItem('fouad_academy_messages', JSON.stringify(messages));
    
    showNotification('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً', 'success');
    
    // مسح النموذج
    document.getElementById('contactForm').reset();
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // إضافة التنسيق
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    // إضافة للصفحة
    document.body.appendChild(notification);
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// الحصول على لون الإشعار
function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        case 'info': return '#3b82f6';
        default: return '#6b7280';
    }
}

// إضافة التنسيقات للإشعارات
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
    
    .notification-message {
        flex: 1;
        font-weight: 500;
    }
`;
document.head.appendChild(notificationStyles);

// التحقق من حالة التحميل
function checkLoadingState() {
    return !isLoading;
}

// تعيين حالة التحميل
function setLoadingState(loading) {
    isLoading = loading;
    
    if (loading) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// البحث في الدورات
function searchCourses(query) {
    if (!query.trim()) {
        return courses;
    }
    
    return courses.filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase()) ||
        course.instructor.toLowerCase().includes(query.toLowerCase())
    );
}

// فلترة الدورات حسب المستوى
function filterCoursesByLevel(level) {
    if (level === 'all') {
        return courses;
    }
    
    return courses.filter(course => course.level === level);
}

// فلترة الدورات حسب السعر
function filterCoursesByPrice(priceFilter) {
    switch (priceFilter) {
        case 'free':
            return courses.filter(course => course.isFree);
        case 'paid':
            return courses.filter(course => !course.isFree);
        case 'under-500':
            return courses.filter(course => !course.isFree && course.price < 500);
        case 'over-500':
            return courses.filter(course => !course.isFree && course.price >= 500);
        default:
            return courses;
    }
}

// ترتيب الدورات
function sortCourses(sortBy) {
    const sortedCourses = [...courses];
    
    switch (sortBy) {
        case 'title':
            return sortedCourses.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
        case 'price-low':
            return sortedCourses.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sortedCourses.sort((a, b) => b.price - a.price);
        case 'rating':
            return sortedCourses.sort((a, b) => b.rating - a.rating);
        case 'students':
            return sortedCourses.sort((a, b) => b.students - a.students);
        case 'newest':
            return sortedCourses.sort((a, b) => b.id - a.id);
        default:
            return sortedCourses;
    }
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// التحقق من قوة كلمة المرور
function validatePassword(password) {
    return {
        isValid: password.length >= 6,
        length: password.length >= 6,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Zا-ي]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('ar-EG', options);
}

// تنسيق المدة الزمنية
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} دقيقة`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours} ساعة و ${remainingMinutes} دقيقة` : `${hours} ساعة`;
    }
}

// تنسيق السعر
function formatPrice(price) {
    if (price === 0) {
        return 'مجاني';
    }
    
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0
    }).format(price);
}

// تنسيق عدد الطلاب
function formatStudentCount(count) {
    if (count < 1000) {
        return count.toString();
    } else if (count < 1000000) {
        return (count / 1000).toFixed(1) + 'ألف';
    } else {
        return (count / 1000000).toFixed(1) + 'مليون';
    }
}

// حفظ إعدادات المستخدم
function saveUserPreferences(preferences) {
    const currentPrefs = JSON.parse(localStorage.getItem('fouad_academy_preferences') || '{}');
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem('fouad_academy_preferences', JSON.stringify(updatedPrefs));
}

// تحميل إعدادات المستخدم
function loadUserPreferences() {
    return JSON.parse(localStorage.getItem('fouad_academy_preferences') || '{}');
}

// تسجيل نشاط المستخدم
function logUserActivity(activity) {
    if (!currentUser) return;
    
    const activities = JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]');
    activities.push({
        userId: currentUser.id,
        activity: activity,
        timestamp: new Date().toISOString(),
        page: window.location.pathname
    });
    
    // الاحتفاظ بآخر 100 نشاط فقط
    if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
    }
    
    localStorage.setItem('fouad_academy_activities', JSON.stringify(activities));
}

// تصدير البيانات للنسخ الاحتياطي
function exportUserData() {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const userData = {
        user: currentUser,
        preferences: loadUserPreferences(),
        activities: JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]')
            .filter(activity => activity.userId === currentUser.id)
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fouad_academy_backup_${currentUser.id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('تم تصدير بياناتك بنجاح', 'success');
}

// استيراد البيانات من النسخة الاحتياطية
function importUserData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.user && data.user.id === currentUser.id) {
                // تحديث البيانات
                saveUserPreferences(data.preferences || {});
                
                if (data.activities) {
                    localStorage.setItem('fouad_academy_activities', JSON.stringify(data.activities));
                }
                
                showNotification('تم استيراد بياناتك بنجاح', 'success');
            } else {
                showNotification('ملف البيانات غير صحيح أو لا يخص حسابك', 'error');
            }
        } catch (error) {
            showNotification('خطأ في قراءة ملف البيانات', 'error');
        }
    };
    
    reader.readAsText(file);
}

// مشاركة دورة
function shareCourse(courseId, platform) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const shareText = `تحقق من دورة "${course.title}" في منصة الفؤاد التعليمية`;
    const shareUrl = `${window.location.origin}/course.html?id=${courseId}`;
    
    switch (platform) {
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
            break;
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
            break;
        case 'copy':
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('تم نسخ الرابط بنجاح', 'success');
            });
            break;
        default:
            if (navigator.share) {
                navigator.share({
                    title: course.title,
                    text: shareText,
                    url: shareUrl
                });
            }
    }
    
    logUserActivity(`شارك دورة: ${course.title}`);
}

// إضافة دورة للمفضلة
function toggleCourseFavorite(courseId) {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem(`fouad_academy_favorites_${currentUser.id}`) || '[]');
    const courseIndex = favorites.indexOf(courseId);
    
    if (courseIndex > -1) {
        favorites.splice(courseIndex, 1);
        showNotification('تم إزالة الدورة من المفضلة', 'info');
    } else {
        favorites.push(courseId);
        showNotification('تم إضافة الدورة للمفضلة', 'success');
    }
    
    localStorage.setItem(`fouad_academy_favorites_${currentUser.id}`, JSON.stringify(favorites));
    logUserActivity(`تبديل المفضلة للدورة: ${courseId}`);
    
    // تحديث واجهة المستخدم
    updateFavoriteButtons();
}

// تحديث أزرار المفضلة
function updateFavoriteButtons() {
    if (!currentUser) return;
    
    const favorites = JSON.parse(localStorage.getItem(`fouad_academy_favorites_${currentUser.id}`) || '[]');
    
    document.querySelectorAll('[data-course-id]').forEach(card => {
        const courseId = parseInt(card.dataset.courseId);
        const favoriteBtn = card.querySelector('.favorite-btn');
        
        if (favoriteBtn) {
            favoriteBtn.innerHTML = favorites.includes(courseId) ? '❤️' : '🤍';
        }
    });
}

// الحصول على الدورات المفضلة
function getFavoriteCourses() {
    if (!currentUser) return [];
    
    const favorites = JSON.parse(localStorage.getItem(`fouad_academy_favorites_${currentUser.id}`) || '[]');
    return courses.filter(course => favorites.includes(course.id));
}

// تقييم دورة
function rateCourse(courseId, rating) {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    if (rating < 1 || rating > 5) {
        showNotification('التقييم يجب أن يكون بين 1 و 5 نجوم', 'error');
        return;
    }
    
    const ratings = JSON.parse(localStorage.getItem('fouad_academy_ratings') || '[]');
    const existingRating = ratings.find(r => r.userId === currentUser.id && r.courseId === courseId);
    
    if (existingRating) {
        existingRating.rating = rating;
        existingRating.date = new Date().toISOString();
    } else {
        ratings.push({
            userId: currentUser.id,
            courseId: courseId,
            rating: rating,
            date: new Date().toISOString()
        });
    }
    
    localStorage.setItem('fouad_academy_ratings', JSON.stringify(ratings));
    
    // تحديث متوسط التقييم للدورة
    updateCourseRating(courseId);
    
    showNotification('تم تسجيل تقييمك بنجاح', 'success');
    logUserActivity(`قيّم دورة: ${courseId} بـ ${rating} نجوم`);
}

// تحديث متوسط تقييم الدورة
function updateCourseRating(courseId) {
    const ratings = JSON.parse(localStorage.getItem('fouad_academy_ratings') || '[]');
    const courseRatings = ratings.filter(r => r.courseId === courseId);
    
    if (courseRatings.length > 0) {
        const average = courseRatings.reduce((sum, r) => sum + r.rating, 0) / courseRatings.length;
        const course = courses.find(c => c.id === courseId);
        
        if (course) {
            course.rating = Math.round(average * 10) / 10;
            saveCoursesData();
        }
    }
}

// التحقق من اتصال الإنترنت
function checkOnlineStatus() {
    return navigator.onLine;
}

// معالجة حالة عدم الاتصال
function handleOfflineMode() {
    if (!checkOnlineStatus()) {
        showNotification('لا يوجد اتصال بالإنترنت. بعض الميزات قد لا تعمل بشكل صحيح.', 'warning');
    }
}

// تسجيل الأخطاء
function logError(error, context = '') {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        context: context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    console.error('خطأ في التطبيق:', errorLog);
    
    // حفظ الخطأ في التخزين المحلي للمراجعة لاحقاً
    const errors = JSON.parse(localStorage.getItem('fouad_academy_errors') || '[]');
    errors.push(errorLog);
    
    // الاحتفاظ بآخر 50 خطأ فقط
    if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('fouad_academy_errors', JSON.stringify(errors));
}

// معالج الأخطاء العام
window.addEventListener('error', function(event) {
    logError(event.error, 'Global Error Handler');
});

// معالج الأخطاء للوعود المرفوضة
window.addEventListener('unhandledrejection', function(event) {
    logError(new Error(event.reason), 'Unhandled Promise Rejection');
});

// التحقق من دعم المتصفح للميزات المطلوبة
function checkBrowserSupport() {
    const requiredFeatures = {
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        json: typeof JSON !== 'undefined'
    };
    
    const unsupported = Object.keys(requiredFeatures).filter(feature => !requiredFeatures[feature]);
    
    if (unsupported.length > 0) {
        showNotification(
            `متصفحك لا يدعم بعض الميزات المطلوبة: ${unsupported.join(', ')}. يرجى تحديث المتصفح.`,
            'error'
        );
        return false;
    }
    
    return true;
}

// تهيئة أحداث عدم الاتصال/الاتصال
window.addEventListener('online', function() {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', function() {
    handleOfflineMode();
});

// تسجيل وقت آخر نشاط للمستخدم
function updateLastActivity() {
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].lastActivity = new Date().toISOString();
            localStorage.setItem('fouad_academy_users', JSON.stringify(users));
        }
    }
}

// تحديث النشاط كل 30 ثانية
setInterval(updateLastActivity, 30000);

// تنظيف البيانات القديمة
function cleanupOldData() {
    try {
        // تنظيف الأنشطة القديمة (أكثر من 30 يوم)
        const activities = JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentActivities = activities.filter(activity => 
            new Date(activity.timestamp) > thirtyDaysAgo
        );
        localStorage.setItem('fouad_academy_activities', JSON.stringify(recentActivities));
        
        // تنظيف الأخطاء القديمة (أكثر من 7 أيام)
        const errors = JSON.parse(localStorage.getItem('fouad_academy_errors') || '[]');
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentErrors = errors.filter(error => 
            new Date(error.timestamp) > sevenDaysAgo
        );
        localStorage.setItem('fouad_academy_errors', JSON.stringify(recentErrors));
        
    } catch (error) {
        logError(error, 'Data Cleanup');
    }
}

// تشغيل تنظيف البيانات عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من دعم المتصفح
    if (!checkBrowserSupport()) {
        return;
    }
    
    // تنظيف البيانات القديمة
    cleanupOldData();
    
    // التحقق من حالة الاتصال
    handleOfflineMode();
    
    // تسجيل تحميل الصفحة
    logUserActivity('تحميل الصفحة الرئيسية');
});

// تصدير الوظائف المطلوبة للنطاق العام
window.fouadAcademy = {
    showLogin,
    showRegister,
    closeAuthModal,
    switchToLogin,
    switchToRegister,
    logout,
    goToDashboard,
    enrollInCourse,
    showAllCourses,
    scrollToSection,
    shareCourse,
    toggleCourseFavorite,
    rateCourse,
    exportUserData,
    importUserData
};

console.log('تم تحميل جميع وظائف منصة الفؤاد التعليمية بنجاح ✅');
