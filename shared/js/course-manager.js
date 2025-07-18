// منصة الفؤاد التعليمية - نظام إدارة الدورات المتقدم

class CourseManager {
    constructor() {
        this.courses = [];
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.totalItems = 0;
        this.filters = {
            search: '',
            status: '',
            level: '',
            price: ''
        };
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.selectedCourses = [];
        
        this.init();
    }

    // تهيئة مدير الدورات
    init() {
        this.loadCourses();
        this.bindEvents();
        this.setupFormValidation();
    }

    // تحميل الدورات
    loadCourses() {
        const savedCourses = localStorage.getItem('fouad_academy_courses');
        if (savedCourses) {
            try {
                this.courses = JSON.parse(savedCourses);
            } catch (error) {
                console.error('خطأ في تحميل الدورات:', error);
                this.courses = this.getDefaultCourses();
            }
        } else {
            this.courses = this.getDefaultCourses();
            this.saveCourses();
        }
        
        this.refreshCoursesList();
    }

    // الحصول على الدورات الافتراضية
    getDefaultCourses() {
        return [
            {
                id: 1,
                title: "ملاذ الحيارى - الاستيقاظ",
                description: "خريطة البحث عن المأوى للقلوب التائهة - رحلة من 7 لقاءات لاكتشاف الذات",
                fullDescription: "رحلة حقيقية للقلوب التعبانة... دليل عملي للي نفسهم يرجعوا لنفسهم بجد",
                instructor: "محمود فؤاد",
                level: "مبتدئ",
                price: 0,
                duration: "7 لقاءات",
                icon: "📚",
                status: "active",
                isFree: true,
                students: 1200,
                rating: 4.9,
                createdAt: "2024-01-15T10:00:00Z",
                updatedAt: "2024-01-15T10:00:00Z",
                sections: [
                    {
                        id: 1,
                        title: "الاستيقاظ - لحظة الصدق",
                        lessons: [
                            {
                                id: 1,
                                title: "المقدمة والسؤال الأول",
                                type: "video",
                                url: "https://youtu.be/GlIrvAzC2I",
                                duration: "45:00"
                            },
                            {
                                id: 2,
                                title: "السؤال الثاني",
                                type: "video",
                                url: "https://youtu.be/NlZ6k0zsOcA",
                                duration: "52:00"
                            }
                        ]
                    }
                ],
                tags: ["تطوير ذاتي", "علم نفس", "تأمل"],
                prerequisites: "",
                startDate: null,
                endDate: null
            },
            {
                id: 2,
                title: "منظور الفؤاد - الأساسيات",
                description: "فهم البنية الرباعية للنفس الإنسانية والأشواق التسعة المودعة في الفطرة",
                fullDescription: "دورة متقدمة في فهم النفس الإنسانية وتحليل الأشواق والدوافع الداخلية",
                instructor: "محمود فؤاد",
                level: "متوسط",
                price: 499,
                duration: "12 درس",
                icon: "🧠",
                status: "active",
                students: 650,
                rating: 4.9,
                createdAt: "2024-03-01T10:00:00Z",
                updatedAt: "2024-03-01T10:00:00Z",
                sections: [],
                tags: ["أخلاق", "تطبيق عملي", "سلوك"],
                prerequisites: "إكمال دورة منظور الفؤاد",
                startDate: null,
                endDate: null
            }
        ];
    }

    // ربط الأحداث
    bindEvents() {
        // البحث
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.refreshCoursesList();
            }, 300));
        }

        // الفلاتر
        const statusFilter = document.getElementById('statusFilter');
        const levelFilter = document.getElementById('levelFilter');
        const priceFilter = document.getElementById('priceFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.currentPage = 1;
                this.refreshCoursesList();
            });
        }

        if (levelFilter) {
            levelFilter.addEventListener('change', () => {
                this.filters.level = levelFilter.value;
                this.currentPage = 1;
                this.refreshCoursesList();
            });
        }

        if (priceFilter) {
            priceFilter.addEventListener('change', () => {
                this.filters.price = priceFilter.value;
                this.currentPage = 1;
                this.refreshCoursesList();
            });
        }

        // نموذج إنشاء الدورة
        const createCourseForm = document.getElementById('createCourseForm');
        if (createCourseForm) {
            createCourseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateCourse();
            });
        }

        // checkbox المجاني
        const isFreeCheckbox = document.getElementById('courseIsFree');
        if (isFreeCheckbox) {
            isFreeCheckbox.addEventListener('change', this.togglePriceField.bind(this));
        }
    }

    // إعداد التحقق من صحة النموذج
    setupFormValidation() {
        const requiredFields = ['courseTitle', 'courseDescription', 'courseInstructor', 'courseLevel'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    }

    // التحقق من صحة الحقل
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name') || field.id;
        let isValid = true;
        let errorMessage = '';

        // التحقق من الحقول المطلوبة
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'هذا الحقل مطلوب';
        }

        // التحقق من طول العنوان
        if (fieldName === 'title' && value.length > 0 && value.length < 3) {
            isValid = false;
            errorMessage = 'العنوان يجب أن يكون 3 أحرف على الأقل';
        }

        // التحقق من السعر
        if (fieldName === 'price') {
            const price = parseFloat(value);
            if (isNaN(price) || price < 0) {
                isValid = false;
                errorMessage = 'السعر يجب أن يكون رقماً موجباً';
            }
        }

        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    // عرض نتيجة التحقق من الحقل
    showFieldValidation(field, isValid, errorMessage) {
        // إزالة الرسائل السابقة
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // إزالة الكلاسات السابقة
        field.classList.remove('field-valid', 'field-invalid');

        if (!isValid && errorMessage) {
            field.classList.add('field-invalid');
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            field.parentNode.appendChild(errorElement);
        } else if (field.value.trim()) {
            field.classList.add('field-valid');
        }
    }

    // مسح خطأ الحقل
    clearFieldError(field) {
        field.classList.remove('field-invalid');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // تبديل حقل السعر
    togglePriceField() {
        const priceField = document.getElementById('coursePrice');
        const isFreeCheckbox = document.getElementById('courseIsFree');
        
        if (priceField && isFreeCheckbox) {
            if (isFreeCheckbox.checked) {
                priceField.value = '0';
                priceField.disabled = true;
                priceField.parentNode.style.opacity = '0.5';
            } else {
                priceField.disabled = false;
                priceField.parentNode.style.opacity = '1';
            }
        }
    }

    // تحديث قائمة الدورات
    refreshCoursesList() {
        const filteredCourses = this.getFilteredCourses();
        const paginatedCourses = this.getPaginatedCourses(filteredCourses);
        
        this.renderCoursesTable(paginatedCourses);
        this.renderPagination(filteredCourses.length);
        this.updateDisplayInfo(filteredCourses.length);
    }

    // الحصول على الدورات المفلترة
    getFilteredCourses() {
        let filtered = [...this.courses];

        // فلترة البحث
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm) ||
                course.instructor.toLowerCase().includes(searchTerm) ||
                (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        // فلترة الحالة
        if (this.filters.status) {
            filtered = filtered.filter(course => course.status === this.filters.status);
        }

        // فلترة المستوى
        if (this.filters.level) {
            filtered = filtered.filter(course => course.level === this.filters.level);
        }

        // فلترة السعر
        if (this.filters.price) {
            switch (this.filters.price) {
                case 'free':
                    filtered = filtered.filter(course => course.isFree || course.price === 0);
                    break;
                case 'paid':
                    filtered = filtered.filter(course => !course.isFree && course.price > 0);
                    break;
            }
        }

        // الترتيب
        filtered.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }

    // الحصول على الدورات مع الترقيم
    getPaginatedCourses(courses) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return courses.slice(startIndex, endIndex);
    }

    // رسم جدول الدورات
    renderCoursesTable(courses) {
        const tableBody = document.getElementById('coursesTableBody');
        if (!tableBody) return;

        if (courses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center no-data">
                        <div class="no-data-message">
                            <span class="no-data-icon">📚</span>
                            <h3>لا توجد دورات</h3>
                            <p>لم يتم العثور على دورات تطابق معايير البحث</p>
                            <button class="btn btn-primary" onclick="courseManager.resetFilters()">إعادة تعيين الفلاتر</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = courses.map(course => this.createCourseTableRow(course)).join('');
    }

    // إنشاء صف الدورة في الجدول
    createCourseTableRow(course) {
        const statusClass = this.getStatusClass(course.status);
        const priceDisplay = course.isFree ? 'مجاني' : `${course.price} جنيه`;
        const ratingStars = this.generateStarRating(course.rating);

        return `
            <tr data-course-id="${course.id}">
                <td>
                    <input type="checkbox" class="course-checkbox" value="${course.id}" 
                           onchange="courseManager.handleCourseSelection(this)">
                </td>
                <td>
                    <div class="course-info">
                        <div class="course-icon">${course.icon}</div>
                        <div class="course-details">
                            <h4 class="course-title">${course.title}</h4>
                            <p class="course-description">${course.description.substring(0, 80)}...</p>
                        </div>
                    </div>
                </td>
                <td>${course.instructor}</td>
                <td>
                    <span class="level-badge level-${course.level}">${course.level}</span>
                </td>
                <td class="price-cell">${priceDisplay}</td>
                <td>
                    <span class="students-count">${course.students || 0}</span>
                </td>
                <td>
                    <div class="rating-display">
                        ${ratingStars}
                        <span class="rating-number">${course.rating || 0}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${this.getStatusText(course.status)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="courseManager.viewCourse(${course.id})" 
                                title="عرض">👁️</button>
                        <button class="btn-icon btn-edit" onclick="courseManager.editCourse(${course.id})" 
                                title="تعديل">✏️</button>
                        <button class="btn-icon btn-duplicate" onclick="courseManager.duplicateCourse(${course.id})" 
                                title="نسخ">📋</button>
                        <button class="btn-icon btn-delete" onclick="courseManager.deleteCourse(${course.id})" 
                                title="حذف">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // الحصول على كلاس الحالة
    getStatusClass(status) {
        const statusClasses = {
            'active': 'active',
            'draft': 'draft',
            'archived': 'archived'
        };
        return statusClasses[status] || 'draft';
    }

    // الحصول على نص الحالة
    getStatusText(status) {
        const statusTexts = {
            'active': 'نشطة',
            'draft': 'مسودة',
            'archived': 'مؤرشفة'
        };
        return statusTexts[status] || 'مسودة';
    }

    // توليد تقييم النجوم
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        
        // نجوم ممتلئة
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        
        // نصف نجمة
        if (hasHalfStar) {
            stars += '✨';
        }
        
        // نجوم فارغة
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }

        return `<span class="stars">${stars}</span>`;
    }

    // رسم الترقيم
    renderPagination(totalItems) {
        const paginationContainer = document.getElementById('coursesPagination');
        if (!paginationContainer) return;

        this.totalItems = totalItems;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // زر السابق
        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        paginationHTML += `
            <button ${prevDisabled} onclick="courseManager.goToPage(${this.currentPage - 1})">
                السابق
            </button>
        `;

        // أرقام الصفحات
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="courseManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <button class="${activeClass}" onclick="courseManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button onclick="courseManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // زر التالي
        const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';
        paginationHTML += `
            <button ${nextDisabled} onclick="courseManager.goToPage(${this.currentPage + 1})">
                التالي
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // تحديث معلومات العرض
    updateDisplayInfo(totalItems) {
        const showingFrom = document.getElementById('showingFrom');
        const showingTo = document.getElementById('showingTo');
        const totalItemsElement = document.getElementById('totalItems');

        if (showingFrom && showingTo && totalItemsElement) {
            const from = (this.currentPage - 1) * this.itemsPerPage + 1;
            const to = Math.min(this.currentPage * this.itemsPerPage, totalItems);

            showingFrom.textContent = totalItems > 0 ? from : 0;
            showingTo.textContent = to;
            totalItemsElement.textContent = totalItems;
        }
    }

    // الانتقال لصفحة معينة
    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.refreshCoursesList();
        }
    }

    // تغيير عدد العناصر في الصفحة
    changeItemsPerPage(newItemsPerPage) {
        this.itemsPerPage = parseInt(newItemsPerPage);
        this.currentPage = 1;
        this.refreshCoursesList();
    }

    // معالجة اختيار الدورة
    handleCourseSelection(checkbox) {
        const courseId = parseInt(checkbox.value);
        
        if (checkbox.checked) {
            if (!this.selectedCourses.includes(courseId)) {
                this.selectedCourses.push(courseId);
            }
        } else {
            this.selectedCourses = this.selectedCourses.filter(id => id !== courseId);
        }

        this.updateBulkActionsVisibility();
    }

    // تحديث رؤية الإجراءات المجمعة
    updateBulkActionsVisibility() {
        const bulkActionsContainer = document.getElementById('bulkActions');
        const selectedCount = this.selectedCourses.length;

        if (bulkActionsContainer) {
            if (selectedCount > 0) {
                bulkActionsContainer.classList.remove('hidden');
                bulkActionsContainer.querySelector('.selected-count').textContent = selectedCount;
            } else {
                bulkActionsContainer.classList.add('hidden');
            }
        }
    }

    // تبديل تحديد الكل
    toggleSelectAll(checkbox) {
        const courseCheckboxes = document.querySelectorAll('.course-checkbox');
        const isChecked = checkbox.checked;

        courseCheckboxes.forEach(cb => {
            cb.checked = isChecked;
            this.handleCourseSelection(cb);
        });
    }

    // إعادة تعيين الفلاتر
    resetFilters() {
        this.filters = {
            search: '',
            status: '',
            level: '',
            price: ''
        };

        // مسح حقول الفلاتر في الواجهة
        const searchInput = document.getElementById('courseSearch');
        const statusFilter = document.getElementById('statusFilter');
        const levelFilter = document.getElementById('levelFilter');
        const priceFilter = document.getElementById('priceFilter');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (levelFilter) levelFilter.value = '';
        if (priceFilter) priceFilter.value = '';

        this.currentPage = 1;
        this.refreshCoursesList();
    }

    // البحث في الدورات
    searchCourses() {
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            this.filters.search = searchInput.value;
            this.currentPage = 1;
            this.refreshCoursesList();
        }
    }

    // فلترة الدورات
    filterCourses() {
        this.currentPage = 1;
        this.refreshCoursesList();
    }

    // عرض نافذة إنشاء دورة
    showCreateCourseModal() {
        const modal = document.getElementById('createCourseModal');
        if (modal) {
            this.resetCreateCourseForm();
            modal.classList.add('show');
            
            // تركيز على الحقل الأول
            setTimeout(() => {
                const firstInput = modal.querySelector('input[type="text"]');
                if (firstInput) firstInput.focus();
            }, 300);
        }
    }

    // إغلاق نافذة إنشاء دورة
    closeCreateCourseModal() {
        const modal = document.getElementById('createCourseModal');
        if (modal) {
            modal.classList.remove('show');
            this.resetCreateCourseForm();
        }
    }

    // إعادة تعيين نموذج إنشاء الدورة
    resetCreateCourseForm() {
        const form = document.getElementById('createCourseForm');
        if (form) {
            form.reset();
            
            // مسح الأخطاء
            form.querySelectorAll('.field-error').forEach(error => error.remove());
            form.querySelectorAll('.field-invalid, .field-valid').forEach(field => {
                field.classList.remove('field-invalid', 'field-valid');
            });

            // إعادة تعيين الأقسام
            const sectionsContainer = document.getElementById('courseSections');
            if (sectionsContainer) {
                sectionsContainer.innerHTML = '';
            }

            // تفعيل حقل السعر
            const priceField = document.getElementById('coursePrice');
            if (priceField) {
                priceField.disabled = false;
                priceField.parentNode.style.opacity = '1';
            }
        }
    }

    // معالجة إنشاء دورة جديدة
    async handleCreateCourse() {
        const formData = this.getFormData();
        
        // التحقق من صحة البيانات
        const validation = this.validateCourseData(formData);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }

        // إنشاء الدورة
        const newCourse = this.createCourseObject(formData);
        
        try {
            // إضافة الدورة
            this.courses.push(newCourse);
            this.saveCourses();
            
            // تحديث الواجهة
            this.refreshCoursesList();
            this.closeCreateCourseModal();
            
            this.showNotification(`تم إنشاء دورة "${newCourse.title}" بنجاح!`, 'success');
            
            // تسجيل النشاط
            this.logActivity('course_created', {
                courseId: newCourse.id,
                courseTitle: newCourse.title
            });

        } catch (error) {
            console.error('خطأ في إنشاء الدورة:', error);
            this.showNotification('حدث خطأ أثناء إنشاء الدورة', 'error');
        }
    }

    // الحصول على بيانات النموذج
    getFormData() {
        const form = document.getElementById('createCourseForm');
        const formData = new FormData(form);
        const data = {};

        // الحقول الأساسية
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // معالجة الحقول الخاصة
        data.isFree = document.getElementById('courseIsFree').checked;
        data.price = data.isFree ? 0 : parseFloat(data.price) || 0;
        data.tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        // جمع الأقسام والدروس
        data.sections = this.collectCourseSections();

        return data;
    }

    // جمع أقسام الدورة
    collectCourseSections() {
        const sectionsContainer = document.getElementById('courseSections');
        const sections = [];

        if (sectionsContainer) {
            const sectionElements = sectionsContainer.querySelectorAll('.course-section');
            
            sectionElements.forEach((sectionEl, index) => {
                const titleInput = sectionEl.querySelector('.section-title');
                const lessonElements = sectionEl.querySelectorAll('.lesson-item');
                
                const section = {
                    id: index + 1,
                    title: titleInput ? titleInput.value : `القسم ${index + 1}`,
                    lessons: []
                };

                lessonElements.forEach((lessonEl, lessonIndex) => {
                    const titleInput = lessonEl.querySelector('.lesson-title');
                    const typeSelect = lessonEl.querySelector('.lesson-type');
                    const urlInput = lessonEl.querySelector('.lesson-url');
                    const durationInput = lessonEl.querySelector('.lesson-duration');

                    if (titleInput && titleInput.value) {
                        section.lessons.push({
                            id: lessonIndex + 1,
                            title: titleInput.value,
                            type: typeSelect ? typeSelect.value : 'video',
                            url: urlInput ? urlInput.value : '',
                            duration: durationInput ? durationInput.value : ''
                        });
                    }
                });

                if (section.title) {
                    sections.push(section);
                }
            });
        }

        return sections;
    }

    // التحقق من صحة بيانات الدورة
    validateCourseData(data) {
        const errors = [];

        // التحقق من الحقول المطلوبة
        if (!data.title || data.title.trim().length < 3) {
            errors.push('عنوان الدورة يجب أن يكون 3 أحرف على الأقل');
        }

        if (!data.description || data.description.trim().length < 10) {
            errors.push('وصف الدورة يجب أن يكون 10 أحرف على الأقل');
        }

        if (!data.instructor || data.instructor.trim().length < 2) {
            errors.push('اسم المدرب مطلوب');
        }

        if (!data.level) {
            errors.push('مستوى الدورة مطلوب');
        }

        if (!data.isFree && (isNaN(data.price) || data.price < 0)) {
            errors.push('سعر الدورة يجب أن يكون رقماً موجباً');
        }

        // التحقق من التواريخ
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            if (endDate <= startDate) {
                errors.push('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
            }
        }

        return {
            isValid: errors.length === 0,
            message: errors.length > 0 ? errors[0] : ''
        };
    }

    // إنشاء كائن الدورة
    createCourseObject(data) {
        const now = new Date().toISOString();
        
        return {
            id: this.generateCourseId(),
            title: data.title.trim(),
            description: data.description.trim(),
            fullDescription: data.fullDescription ? data.fullDescription.trim() : data.description.trim(),
            instructor: data.instructor.trim(),
            level: data.level,
            price: data.price,
            duration: data.duration || '',
            icon: data.icon || '📚',
            status: data.status || 'draft',
            isFree: data.isFree,
            students: 0,
            rating: 0,
            createdAt: now,
            updatedAt: now,
            sections: data.sections || [],
            tags: data.tags || [],
            prerequisites: data.prerequisites || '',
            startDate: data.startDate || null,
            endDate: data.endDate || null
        };
    }

    // توليد معرف فريد للدورة
    generateCourseId() {
        const existingIds = this.courses.map(course => course.id);
        let newId = Math.max(...existingIds, 0) + 1;
        
        // التأكد من عدم تكرار المعرف
        while (existingIds.includes(newId)) {
            newId++;
        }
        
        return newId;
    }

    // إضافة قسم جديد للدورة
    addCourseSection() {
        const sectionsContainer = document.getElementById('courseSections');
        if (!sectionsContainer) return;

        const sectionIndex = sectionsContainer.children.length + 1;
        const sectionHTML = this.createSectionHTML(sectionIndex);
        
        const sectionElement = document.createElement('div');
        sectionElement.innerHTML = sectionHTML;
        sectionsContainer.appendChild(sectionElement.firstElementChild);
    }

    // إنشاء HTML للقسم
    createSectionHTML(index) {
        return `
            <div class="course-section" data-section-index="${index}">
                <div class="section-header">
                    <h4>القسم ${index}</h4>
                    <button type="button" class="btn-icon btn-remove" onclick="courseManager.removeSection(this)" title="حذف القسم">
                        🗑️
                    </button>
                </div>
                <div class="section-body">
                    <div class="form-group">
                        <label>عنوان القسم</label>
                        <input type="text" class="section-title" placeholder="أدخل عنوان القسم">
                    </div>
                    <div class="lessons-container">
                        <h5>الدروس</h5>
                        <div class="lessons-list">
                            <!-- ستُضاف الدروس هنا -->
                        </div>
                        <button type="button" class="btn btn-outline btn-small" onclick="courseManager.addLesson(this)">
                            ➕ إضافة درس
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // حذف قسم
    removeSection(button) {
        const section = button.closest('.course-section');
        if (section) {
            section.remove();
            this.updateSectionNumbers();
        }
    }

    // تحديث أرقام الأقسام
    updateSectionNumbers() {
        const sections = document.querySelectorAll('.course-section');
        sections.forEach((section, index) => {
            const header = section.querySelector('.section-header h4');
            if (header) {
                header.textContent = `القسم ${index + 1}`;
            }
            section.setAttribute('data-section-index', index + 1);
        });
    }

    // إضافة درس
    addLesson(button) {
        const section = button.closest('.course-section');
        const lessonsList = section.querySelector('.lessons-list');
        
        if (lessonsList) {
            const lessonIndex = lessonsList.children.length + 1;
            const lessonHTML = this.createLessonHTML(lessonIndex);
            
            const lessonElement = document.createElement('div');
            lessonElement.innerHTML = lessonHTML;
            lessonsList.appendChild(lessonElement.firstElementChild);
        }
    }

    // إنشاء HTML للدرس
    createLessonHTML(index) {
        return `
            <div class="lesson-item" data-lesson-index="${index}">
                <div class="lesson-header">
                    <span class="lesson-number">${index}</span>
                    <input type="text" class="lesson-title" placeholder="عنوان الدرس">
                    <button type="button" class="btn-icon btn-small btn-remove" onclick="courseManager.removeLesson(this)" title="حذف الدرس">
                        ❌
                    </button>
                </div>
                <div class="lesson-details">
                    <select class="lesson-type">
                        <option value="video">فيديو</option>
                        <option value="article">مقال</option>
                        <option value="quiz">اختبار</option>
                        <option value="assignment">واجب</option>
                    </select>
                    <input type="url" class="lesson-url" placeholder="رابط المحتوى">
                    <input type="text" class="lesson-duration" placeholder="المدة (مثال: 15:30)">
                </div>
            </div>
        `;
    }

    // حذف درس
    removeLesson(button) {
        const lesson = button.closest('.lesson-item');
        if (lesson) {
            lesson.remove();
            this.updateLessonNumbers();
        }
    }

    // تحديث أرقام الدروس
    updateLessonNumbers() {
        const sections = document.querySelectorAll('.course-section');
        sections.forEach(section => {
            const lessons = section.querySelectorAll('.lesson-item');
            lessons.forEach((lesson, index) => {
                const numberSpan = lesson.querySelector('.lesson-number');
                if (numberSpan) {
                    numberSpan.textContent = index + 1;
                }
                lesson.setAttribute('data-lesson-index', index + 1);
            });
        });
    }

    // حفظ الدورات
    saveCourses() {
        localStorage.setItem('fouad_academy_courses', JSON.stringify(this.courses));
    }

    // حفظ كمسودة
    saveDraft() {
        const formData = this.getFormData();
        formData.status = 'draft';
        
        // حفظ في التخزين المؤقت
        const draftKey = `fouad_academy_course_draft_${Date.now()}`;
        localStorage.setItem(draftKey, JSON.stringify(formData));
        
        this.showNotification('تم حفظ المسودة بنجاح', 'success');
    }

    // عرض الدورة
    viewCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            // في التطبيق الحقيقي، فتح صفحة عرض الدورة
            window.open(`../course-viewer.html?id=${courseId}`, '_blank');
        }
    }

    // تعديل الدورة
    editCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.populateEditForm(course);
            this.showCreateCourseModal();
        }
    }

    // ملء نموذج التعديل
    populateEditForm(course) {
        const form = document.getElementById('createCourseForm');
        if (!form) return;

        // ملء الحقول الأساسية
        const fields = [
            'courseTitle', 'courseDescription', 'courseFullDescription',
            'courseInstructor', 'courseLevel', 'coursePrice', 'courseDuration',
            'courseIcon', 'courseStatus', 'coursePrerequisites'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const courseProperty = fieldId.replace('course', '').toLowerCase();
            if (field && course[courseProperty] !== undefined) {
                field.value = course[courseProperty];
            }
        });

        // checkbox المجاني
        const isFreeCheckbox = document.getElementById('courseIsFree');
        if (isFreeCheckbox) {
            isFreeCheckbox.checked = course.isFree;
            this.togglePriceField();
        }

        // الكلمات المفتاحية
        const tagsField = document.getElementById('courseTags');
        if (tagsField && course.tags) {
            tagsField.value = course.tags.join(', ');
        }

        // التواريخ
        if (course.startDate) {
            const startDateField = document.getElementById('courseStartDate');
            if (startDateField) {
                startDateField.value = new Date(course.startDate).toISOString().slice(0, 16);
            }
        }

        if (course.endDate) {
            const endDateField = document.getElementById('courseEndDate');
            if (endDateField) {
                endDateField.value = new Date(course.endDate).toISOString().slice(0, 16);
            }
        }

        // الأقسام والدروس
        this.populateCourseSections(course.sections || []);

        // تحديث عنوان النافذة
        const modalTitle = document.querySelector('#createCourseModal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = `تعديل دورة: ${course.title}`;
        }

        // إضافة معرف الدورة للنموذج
        form.setAttribute('data-course-id', course.id);
    }

    // ملء أقسام الدورة
    populateCourseSections(sections) {
        const sectionsContainer = document.getElementById('courseSections');
        if (!sectionsContainer) return;

        sectionsContainer.innerHTML = '';

        sections.forEach((section, index) => {
            this.addCourseSection();
            
            const sectionElement = sectionsContainer.children[index];
            const titleInput = sectionElement.querySelector('.section-title');
            if (titleInput) {
                titleInput.value = section.title;
            }

            const lessonsList = sectionElement.querySelector('.lessons-list');
            if (lessonsList && section.lessons) {
                section.lessons.forEach(lesson => {
                    const addButton = sectionElement.querySelector('.btn[onclick*="addLesson"]');
                    if (addButton) {
                        this.addLesson(addButton);
                        
                        const lastLesson = lessonsList.lastElementChild;
                        if (lastLesson) {
                            const titleInput = lastLesson.querySelector('.lesson-title');
                            const typeSelect = lastLesson.querySelector('.lesson-type');
                            const urlInput = lastLesson.querySelector('.lesson-url');
                            const durationInput = lastLesson.querySelector('.lesson-duration');

                            if (titleInput) titleInput.value = lesson.title;
                            if (typeSelect) typeSelect.value = lesson.type;
                            if (urlInput) urlInput.value = lesson.url || '';
                            if (durationInput) durationInput.value = lesson.duration || '';
                        }
                    }
                });
            }
        });
    }

    // نسخ الدورة
    duplicateCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const duplicatedCourse = {
            ...course,
            id: this.generateCourseId(),
            title: `${course.title} - نسخة`,
            students: 0,
            rating: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.courses.push(duplicatedCourse);
        this.saveCourses();
        this.refreshCoursesList();

        this.showNotification(`تم نسخ الدورة "${course.title}" بنجاح`, 'success');
    }

    // حذف الدورة
    deleteCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const confirmMessage = `هل أنت متأكد من حذف دورة "${course.title}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`;
        
        if (confirm(confirmMessage)) {
            this.courses = this.courses.filter(c => c.id !== courseId);
            this.saveCourses();
            this.refreshCoursesList();

            this.showNotification(`تم حذف دورة "${course.title}" بنجاح`, 'success');

            // تسجيل النشاط
            this.logActivity('course_deleted', {
                courseId: courseId,
                courseTitle: course.title
            });
        }
    }

    // تصدير الدورات
    exportCourses() {
        try {
            const dataStr = JSON.stringify(this.courses, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `fouad_academy_courses_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('تم تصدير الدورات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في تصدير الدورات:', error);
            this.showNotification('حدث خطأ أثناء تصدير الدورات', 'error');
        }
    }

    // استيراد الدورات
    importCourses() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedCourses = JSON.parse(e.target.result);
                    
                    if (!Array.isArray(importedCourses)) {
                        throw new Error('تنسيق الملف غير صحيح');
                    }

                    // دمج الدورات المستوردة
                    let addedCount = 0;
                    importedCourses.forEach(course => {
                        // التحقق من عدم وجود الدورة مسبقاً
                        if (!this.courses.find(c => c.id === course.id)) {
                            this.courses.push({
                                ...course,
                                id: this.generateCourseId(), // إعطاء معرف جديد لتجنب التضارب
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            });
                            addedCount++;
                        }
                    });

                    this.saveCourses();
                    this.refreshCoursesList();

                    this.showNotification(`تم استيراد ${addedCount} دورة بنجاح`, 'success');

                } catch (error) {
                    console.error('خطأ في استيراد الدورات:', error);
                    this.showNotification('حدث خطأ أثناء استيراد الدورات', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // تسجيل النشاط
    logActivity(action, data) {
        if (window.authManager && window.authManager.currentUser) {
            const activity = {
                userId: window.authManager.currentUser.id,
                action: action,
                data: data,
                timestamp: new Date().toISOString()
            };

            const activities = JSON.parse(localStorage.getItem('fouad_academy_activities') || '[]');
            activities.unshift(activity);
            
            // الاحتفاظ بآخر 100 نشاط
            if (activities.length > 100) {
                activities.splice(100);
            }

            localStorage.setItem('fouad_academy_activities', JSON.stringify(activities));
        }
    }

    // وظيفة مساعدة للتأخير
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// إنشاء مثيل من مدير الدورات
let courseManager;

// تهيئة مدير الدورات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التأكد من أن المستخدم مدير
    if (window.authManager && window.authManager.hasRole('admin')) {
        courseManager = new CourseManager();
        
        // ربط الوظائف بالنطاق العام للتوافق مع HTML
        window.courseManager = courseManager;
        
        console.log('تم تحميل مدير الدورات بنجاح ✅');
    } else {
        console.log('المستخدم ليس مديراً - لن يتم تحميل مدير الدورات');
        
        // إعادة توجيه للصفحة الرئيسية
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// تصدير الكلاس للاستخدام في أماكن أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseManager;
},
                students: 850,
                rating: 4.8,
                createdAt: "2024-02-01T10:00:00Z",
                updatedAt: "2024-02-01T10:00:00Z",
                sections: [],
                tags: ["علم نفس", "تحليل الشخصية", "تطوير ذاتي"],
                prerequisites: "إكمال دورة ملاذ الحيارى",
                startDate: null,
                endDate: null
            },
            {
                id: 3,
                title: "مكارم الأخلاق العملية",
                description: "رحلة تطبيقية لتحقيق مكارم الأخلاق في الحياة اليومية وفق مراد الله",
                fullDescription: "دورة عملية تطبيقية لتحقيق مكارم الأخلاق وتطبيقها في الحياة اليومية",
                instructor: "محمود فؤاد",
                level: "متقدم",
                price: 699,
                duration: "15 درس",
                icon: "⭐",
                status: "draft",
                isFree: false
