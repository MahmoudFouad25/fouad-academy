// منصة الفؤاد التعليمية - وظائف لوحة الإدارة

class AdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.notifications = [];
        this.activities = [];
        this.dashboardData = {
            users: { total: 0, change: 0 },
            courses: { total: 0, change: 0 },
            revenue: { total: 0, change: 0 },
            rating: { average: 0, change: 0 }
        };
        
        this.init();
    }

    // تهيئة لوحة الإدارة
    init() {
        this.checkAdminAccess();
        this.loadDashboardData();
        this.bindNavigationEvents();
        this.loadNotifications();
        this.loadRecentActivities();
        this.initializeCharts();
    }

    // التحقق من صلاحية الوصول للوحة الإدارة
    checkAdminAccess() {
        if (!window.authManager || !window.authManager.hasRole('admin')) {
            this.showNotification('ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            return false;
        }
        
        // تحديث معلومات المدير في الواجهة
        this.updateAdminInfo();
        return true;
    }

    // تحديث معلومات المدير
    updateAdminInfo() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        const adminName = document.getElementById('adminName');
        const adminAvatar = document.getElementById('adminAvatar');

        if (adminName) {
            adminName.textContent = currentUser.name;
        }

        if (adminAvatar) {
            const initials = currentUser.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
            adminAvatar.textContent = initials;
        }
    }

    // تحميل بيانات لوحة الإدارة
    async loadDashboardData() {
        try {
            // تحميل إحصائيات المستخدمين
            const users = this.getAllUsers();
            this.dashboardData.users.total = users.length;
            this.dashboardData.users.change = this.calculateUserGrowth(users);

            // تحميل إحصائيات الدورات
            const courses = this.getAllCourses();
            this.dashboardData.courses.total = courses.length;
            this.dashboardData.courses.change = this.calculateCourseGrowth(courses);

            // تحميل إحصائيات الإيرادات
            const payments = this.getAllPayments();
            this.dashboardData.revenue.total = this.calculateTotalRevenue(payments);
            this.dashboardData.revenue.change = this.calculateRevenueGrowth(payments);

            // تحميل متوسط التقييم
            this.dashboardData.rating.average = this.calculateAverageRating(courses);
            this.dashboardData.rating.change = this.calculateRatingChange(courses);

            // تحديث الواجهة
            this.updateDashboardStats();
            this.updateQuickStats();

        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة الإدارة:', error);
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
        }
    }

    // الحصول على جميع المستخدمين
    getAllUsers() {
        return JSON.parse(localStorage.getItem('fouad_academy_users') || '[]');
    }

    // الحصول على جميع الدورات
    getAllCourses() {
        return JSON.parse(localStorage.getItem('fouad_academy_courses') || '[]');
    }

    // الحصول على جميع المدفوعات
    getAllPayments() {
        return JSON.parse(localStorage.getItem('fouad_academy_payments') || '[]');
    }

    // حساب نمو المستخدمين
    calculateUserGrowth(users) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = users.filter(user => 
            new Date(user.joinDate) > thirtyDaysAgo
        );

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const previousPeriodUsers = users.filter(user => {
            const joinDate = new Date(user.joinDate);
            return joinDate > sixtyDaysAgo && joinDate <= thirtyDaysAgo;
        });

        if (previousPeriodUsers.length === 0) return 100;

        return Math.round(((recentUsers.length - previousPeriodUsers.length) / previousPeriodUsers.length) * 100);
    }

    // حساب نمو الدورات
    calculateCourseGrowth(courses) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCourses = courses.filter(course => 
            new Date(course.createdAt) > thirtyDaysAgo
        );

        // نسبة النمو الافتراضية
        return recentCourses.length > 0 ? Math.min(recentCourses.length * 10, 50) : 0;
    }

    // حساب إجمالي الإيرادات
    calculateTotalRevenue(payments) {
        return payments
            .filter(payment => payment.status === 'approved')
            .reduce((total, payment) => total + (payment.amount || 0), 0);
    }

    // حساب نمو الإيرادات
    calculateRevenueGrowth(payments) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRevenue = payments
            .filter(payment => 
                payment.status === 'approved' && 
                new Date(payment.createdAt) > thirtyDaysAgo
            )
            .reduce((total, payment) => total + (payment.amount || 0), 0);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const previousRevenue = payments
            .filter(payment => {
                const paymentDate = new Date(payment.createdAt);
                return payment.status === 'approved' && 
                       paymentDate > sixtyDaysAgo && 
                       paymentDate <= thirtyDaysAgo;
            })
            .reduce((total, payment) => total + (payment.amount || 0), 0);

        if (previousRevenue === 0) return recentRevenue > 0 ? 100 : 0;

        return Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100);
    }

    // حساب متوسط التقييم
    calculateAverageRating(courses) {
        const ratingsSum = courses.reduce((sum, course) => sum + (course.rating || 0), 0);
        return courses.length > 0 ? Math.round((ratingsSum / courses.length) * 10) / 10 : 0;
    }

    // حساب تغيير التقييم
    calculateRatingChange(courses) {
        // حساب مبسط للتغيير في التقييم
        return 0.2;
    }

    // تحديث إحصائيات لوحة الإدارة
    updateDashboardStats() {
        // تحديث الأرقام الرئيسية
        this.updateStatElement('totalUsers', this.dashboardData.users.total);
        this.updateStatElement('totalCourses', this.dashboardData.courses.total);
        this.updateStatElement('totalRevenue', this.formatCurrency(this.dashboardData.revenue.total));
        this.updateStatElement('averageRating', this.dashboardData.rating.average);

        // تحديث نسب التغيير
        this.updateChangeElement('usersChange', this.dashboardData.users.change);
        this.updateChangeElement('coursesChange', this.dashboardData.courses.change);
        this.updateChangeElement('revenueChange', this.dashboardData.revenue.change);
        this.updateChangeElement('ratingChange', `+${this.dashboardData.rating.change}`);

        // تحديث الجداول
        this.updateRecentUsersTable();
        this.updatePopularCoursesTable();
    }

    // تحديث الإحصائيات السريعة
    updateQuickStats() {
        this.updateStatElement('totalUsersQuick', this.dashboardData.users.total);
        this.updateStatElement('totalCoursesQuick', this.dashboardData.courses.total);
        this.updateStatElement('totalRevenueQuick', this.formatCurrency(this.dashboardData.revenue.total));
    }

    // تحديث عنصر إحصائي
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'number' && elementId.includes('total') && !elementId.includes('Revenue')) {
                this.animateNumber(element, value);
            } else {
                element.textContent = value;
            }
        }
    }

    // تحديث عنصر التغيير
    updateChangeElement(elementId, change) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${change > 0 ? '+' : ''}${change}%`;
            element.className = change >= 0 ? 'stat-change positive' : 'stat-change negative';
        }
    }

    // تحريك الأرقام
    animateNumber(element, targetValue) {
        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };

        requestAnimationFrame(animate);
    }

    // تنسيق العملة
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // تحديث جدول المستخدمين الجدد
    updateRecentUsersTable() {
        const tableBody = document.getElementById('recentUsersTable');
        if (!tableBody) return;

        const users = this.getAllUsers()
            .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
            .slice(0, 5);

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${this.formatDate(user.joinDate)}</td>
                <td>
                    <span class="status-badge active">نشط</span>
                </td>
            </tr>
        `).join('');
    }

    // تحديث جدول الدورات الشائعة
    updatePopularCoursesTable() {
        const tableBody = document.getElementById('popularCoursesTable');
        if (!tableBody) return;

        const courses = this.getAllCourses()
            .sort((a, b) => (b.students || 0) - (a.students || 0))
            .slice(0, 5);

        if (courses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد دورات</td></tr>';
            return;
        }

        tableBody.innerHTML = courses.map(course => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.2rem;">${course.icon || '📚'}</span>
                        ${course.title}
                    </div>
                </td>
                <td>${course.students || 0}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>⭐</span>
                        ${course.rating || 0}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${this.getCourseStatusClass(course.status)}">
                        ${this.getCourseStatusText(course.status)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // الحصول على كلاس حالة الدورة
    getCourseStatusClass(status) {
        const statusClasses = {
            'active': 'active',
            'draft': 'draft',
            'archived': 'archived'
        };
        return statusClasses[status] || 'draft';
    }

    // الحصول على نص حالة الدورة
    getCourseStatusText(status) {
        const statusTexts = {
            'active': 'نشطة',
            'draft': 'مسودة',
            'archived': 'مؤرشفة'
        };
        return statusTexts[status] || 'مسودة';
    }

    // ربط أحداث التنقل
    bindNavigationEvents() {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
    }

    // التنقل إلى صفحة
    navigateToPage(page) {
        // إخفاء جميع الصفحات
        const allPages = document.querySelectorAll('.admin-page');
        allPages.forEach(p => p.classList.remove('active'));

        // إخفاء جميع روابط التنقل النشطة
        const allNavLinks = document.querySelectorAll('.admin-nav-link');
        allNavLinks.forEach(link => link.classList.remove('active'));

        // عرض الصفحة المطلوبة
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // تنشيط رابط التنقل
        const targetNavLink = document.querySelector(`[data-page="${page}"]`);
        if (targetNavLink) {
            targetNavLink.classList.add('active');
        }

        // تحديث الصفحة الحالية
        this.currentPage = page;

        // تحميل بيانات الصفحة إذا لزم الأمر
        this.loadPageData(page);

        // تحديث URL
        window.history.pushState({ page }, '', `#${page}`);
    }

    // تحميل بيانات الصفحة
    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'courses':
                if (window.courseManager) {
                    window.courseManager.refreshCoursesList();
                }
                break;
            case 'users':
                this.loadUsersData();
                break;
            case 'payments':
                this.loadPaymentsData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
    }

    // تحميل الإشعارات
    loadNotifications() {
        // تحميل الإشعارات من التخزين المحلي أو إنشاء إشعارات تجريبية
        this.notifications = this.generateSampleNotifications();
        this.updateNotificationsBadge();
    }

    // إنشاء إشعارات تجريبية
    generateSampleNotifications() {
        const now = new Date();
        return [
            {
                id: 1,
                title: 'مستخدم جديد',
                message: 'انضم أحمد محمد إلى المنصة',
                type: 'user',
                time: new Date(now - 10 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: 2,
                title: 'طلب دفع جديد',
                message: 'طلب دفع لدورة "منظور الفؤاد" بقيمة 499 جنيه',
                type: 'payment',
                time: new Date(now - 30 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: 3,
                title: 'تقييم جديد',
                message: 'تقييم 5 نجوم لدورة "ملاذ الحيارى"',
                type: 'rating',
                time: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                read: true
            }
        ];
    }

    // تحديث شارة الإشعارات
    updateNotificationsBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationCount');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    // تبديل لوحة الإشعارات
    toggleNotifications() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            const isVisible = panel.classList.contains('show');
            
            if (isVisible) {
                panel.classList.remove('show');
            } else {
                panel.classList.add('show');
                this.renderNotifications();
            }
        }
    }

    // رسم الإشعارات
    renderNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        if (this.notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <span style="font-size: 3rem;">🔔</span>
                    <p>لا توجد إشعارات</p>
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                 onclick="adminDashboard.markAsRead(${notification.id})">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-text">${notification.message}</div>
                <div class="notification-time">${this.formatRelativeTime(notification.time)}</div>
            </div>
        `).join('');
    }

    // تعيين الإشعار كمقروء
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationsBadge();
            this.renderNotifications();
        }
    }

    // تعيين جميع الإشعارات كمقروءة
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationsBadge();
        this.renderNotifications();
    }

    // تحميل الأنشطة الحديثة
    loadRecentActivities() {
        const activities = JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]');
        this.activities = activities.slice(0, 10); // أحدث 10 أنشطة
        this.renderRecentActivities();
    }

    // رسم الأنشطة الحديثة
    renderRecentActivities() {
        const activitiesContainer = document.getElementById('recentActivities');
        if (!activitiesContainer) return;

        if (this.activities.length === 0) {
            activitiesContainer.innerHTML = `
                <div class="no-activities">
                    <span style="font-size: 2rem;">📊</span>
                    <p>لا توجد أنشطة</p>
                </div>
            `;
            return;
        }

        activitiesContainer.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-text">${this.getActivityText(activity)}</div>
                <div class="activity-time">${this.formatRelativeTime(activity.timestamp)}</div>
            </div>
        `).join('');
    }

    // الحصول على نص النشاط
    getActivityText(activity) {
        const actionTexts = {
            'login_success': 'تسجيل دخول بنجاح',
            'course_created': `إنشاء دورة: ${activity.data?.courseTitle || 'غير محدد'}`,
            'course_deleted': `حذف دورة: ${activity.data?.courseTitle || 'غير محدد'}`,
            'user_registered': 'تسجيل مستخدم جديد',
            'payment_approved': 'الموافقة على دفعة',
            'payment_rejected': 'رفض دفعة'
        };

        return actionTexts[activity.action] || activity.action;
    }

    // تهيئة الرسوم البيانية
    initializeCharts() {
        // رسم بياني لنمو المستخدمين
        this.createUsersChart();
        
        // رسم بياني للإيرادات
        this.createRevenueChart();
    }

    // إنشاء رسم بياني للمستخدمين
    createUsersChart() {
        const canvas = document.getElementById('usersChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // مسح الكانفاس
        ctx.clearRect(0, 0, width, height);

        // بيانات تجريبية لنمو المستخدمين
        const data = this.generateUsersChartData();
        
        // رسم الخط البياني
        this.drawLineChart(ctx, data, width, height, '#3b82f6');
    }

    // إنشاء رسم بياني للإيرادات
    createRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // مسح الكانفاس
        ctx.clearRect(0, 0, width, height);

        // بيانات تجريبية للإيرادات
        const data = this.generateRevenueChartData();
        
        // رسم الرسم البياني العمودي
        this.drawBarChart(ctx, data, width, height, '#10b981');
    }

    // توليد بيانات رسم المستخدمين
    generateUsersChartData() {
        const days = 30;
        const data = [];
        const baseUsers = 50;

        for (let i = 0; i < days; i++) {
            const growth = Math.random() * 10 + i * 0.5;
            data.push({
                label: `يوم ${i + 1}`,
                value: Math.floor(baseUsers + growth)
            });
        }

        return data;
    }

    // توليد بيانات رسم الإيرادات
    generateRevenueChartData() {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
        const data = [];

        months.forEach((month, index) => {
            const revenue = Math.random() * 10000 + 5000 + index * 1000;
            data.push({
                label: month,
                value: Math.floor(revenue)
            });
        });

        return data;
    }

    // رسم خط بياني
    drawLineChart(ctx, data, width, height, color) {
        if (data.length === 0) return;

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // العثور على القيم الدنيا والعليا
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;

        // رسم الخطوط الشبكية
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // خطوط أفقية
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // خطوط عمودية
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // رسم الخط
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // رسم النقاط
        ctx.fillStyle = color;
        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // رسم رسم بياني عمودي
    drawBarChart(ctx, data, width, height, color) {
        if (data.length === 0) return;

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.6;
        const barSpacing = chartWidth / data.length * 0.4;

        // رسم الأعمدة
        ctx.fillStyle = color;

        data.forEach((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = height - padding - barHeight;

            ctx.fillRect(x, y, barWidth, barHeight);

            // رسم القيمة فوق العمود
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.formatCurrency(point.value),
                x + barWidth / 2,
                y - 5
            );
            ctx.fillStyle = color;
        });
    }

    // تحميل بيانات المستخدمين
    loadUsersData() {
        // سيتم تنفيذها في المرحلة التالية
        console.log('تحميل بيانات المستخدمين...');
    }

    // تحميل بيانات المدفوعات
    loadPaymentsData() {
        // سيتم تنفيذها في المرحلة التالية
        console.log('تحميل بيانات المدفوعات...');
    }

    // تحميل بيانات التحليلات
    loadAnalyticsData() {
        // سيتم تنفيذها في المرحلة التالية
        console.log('تحميل بيانات التحليلات...');
    }

    // إجراءات مجمعة
    showBulkActionsModal() {
        // سيتم تنفيذها في المرحلة التالية
        console.log('عرض نافذة الإجراءات المجمعة...');
    }

    // تصدير البيانات
    exportData() {
        try {
            const data = {
                users: this.getAllUsers(),
                courses: this.getAllCourses(),
                payments: this.getAllPayments(),
                activities: JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]'),
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `fouad_academy_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('تم تصدير البيانات بنجاح', 'success');

        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showNotification('حدث خطأ أثناء تصدير البيانات', 'error');
        }
    }

    // تبديل قائمة المستخدم
    toggleUserMenu() {
        // سيتم إضافة قائمة منسدلة للمستخدم
        console.log('تبديل قائمة المستخدم...');
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('ar-EG', options);
    }

    // تنسيق الوقت النسبي
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'منذ لحظات';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `منذ ${minutes} دقيقة`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `منذ ${hours} ساعة`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `منذ ${days} يوم`;
        }
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // معالجة تغيير حجم النافذة
    handleResize() {
        // إعادة رسم الرسوم البيانية
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }
}

// إنشاء مثيل من لوحة الإدارة
let adminDashboard;

// تهيئة لوحة الإدارة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التأكد من وجود مدير المصادقة
    if (window.authManager) {
        adminDashboard = new AdminDashboard();
        
        // ربط الوظائف بالنطاق العام
        window.adminDashboard = adminDashboard;
        window.navigateToPage = (page) => adminDashboard.navigateToPage(page);
        window.toggleNotifications = () => adminDashboard.toggleNotifications();
        window.toggleUserMenu = () => adminDashboard.toggleUserMenu();
        window.markAllAsRead = () => adminDashboard.markAllAsRead();
        window.showCreateCourseModal = () => {
            if (window.courseManager) {
                window.courseManager.showCreateCourseModal();
            }
        };
        window.showBulkActionsModal = () => adminDashboard.showBulkActionsModal();
        window.exportData = () => adminDashboard.exportData();

        // معالجة تغيير حجم النافذة
        window.addEventListener('resize', () => adminDashboard.handleResize());

        // معالجة الرجوع في المتصفح
        window.addEventListener('popstate', function(event) {
            const page = event.state?.page || 'dashboard';
            adminDashboard.navigateToPage(page);
        });

        // معالجة الهاش في URL
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'courses', 'users', 'payments', 'content', 'analytics'].includes(hash)) {
            adminDashboard.navigateToPage(hash);
        }

        console.log('تم تحميل لوحة الإدارة بنجاح ✅');
    } else {
        console.error('مدير المصادقة غير متوفر');
    }
});

// إغلاق الإشعارات عند النقر خارجها
document.addEventListener('click', function(event) {
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationButton = event.target.closest('[onclick*="toggleNotifications"]');
    
    if (notificationsPanel && !notificationsPanel.contains(event.target) && !notificationButton) {
        notificationsPanel.classList.remove('show');
    }
});

// تصدير الكلاس للاستخدام في أماكن أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
