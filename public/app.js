const toCurrency = salary =>{
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'BYN'
    }).format(salary);
}

const toDate = date =>{
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date))
}

document.querySelectorAll('.salary').forEach(node => {
    node.textContent = toCurrency(node.textContent)
});

document.querySelectorAll('.date').forEach(node =>{
    node.textContent = toDate(node.textContent)
})

document.addEventListener('DOMContentLoaded', function() {
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdowns, {});
});


// Фильтрация вакансий
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Materialize
    M.FormSelect.init(document.querySelectorAll('select'));
    
    const filterForm = document.getElementById('filter-form');
    const vacanciesContainer = document.getElementById('vacancies-container');
    let currentPage = 1;

    // Функция загрузки вакансий
    async function loadVacancies(params = {}) {
        try {
            showLoadingIndicator();
            
            // Добавляем параметры пагинации
            params.page = params.page || 1;
            params.limit = params.limit || 10;

            // Собираем URL с параметрами
            const url = new URL('/vacancies/filter', window.location.origin);
            
            // Добавляем все параметры в URL
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, value);
                }
            });
            
            const response = await fetch(url.toString());
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
            
            currentPage = data.pagination.page;
            renderVacancies(data);
            updateURL(params);
        } catch (error) {
            console.error('Ошибка загрузки вакансий:', error);
            showError(error.message);
        }
    }
    
    function updateURL(params) {
        const url = new URL(window.location);
        
        // Очищаем текущие параметры
        url.search = '';
        
        // Добавляем только нужные параметры
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== '') {
                url.searchParams.set(key, value);
            }
        });
        
        window.history.pushState({}, '', url);
    }
    
    function showLoadingIndicator() {
        vacanciesContainer.innerHTML = `
            <div class="center-align" style="padding: 50px 0;">
                <div class="preloader-wrapper big active">
                    <div class="spinner-layer spinner-blue-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div>
                        <div class="gap-patch">
                            <div class="circle"></div>
                        </div>
                        <div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                <p>Загрузка вакансий...</p>
            </div>
        `;
    }
    
    function showError(message) {
        vacanciesContainer.innerHTML = `
            <div class="center-align red-text" style="padding: 50px 0;">
                <i class="material-icons large">error_outline</i>
                <h5>Ошибка загрузки вакансий</h5>
                <p>${message}</p>
                <button class="btn waves-effect waves-light" onclick="window.location.reload()">
                    Обновить страницу
                </button>
            </div>
        `;
    }
    
    function renderVacancies(data) {
        if (data.vacancies && data.vacancies.length > 0) {
            vacanciesContainer.innerHTML = `
                <div class="vacancies-list">
                    ${data.vacancies.map(vacancy => `
                        <div class="vacancy-card z-depth-1 hoverable">
                            <div class="vacancy-header">
                                <h2>${vacancy.title}</h2>
                                <div class="salary">${vacancy.salary ? toCurrency(vacancy.salary) : 'По договорённости'}</div>
                            </div>
                            <div class="vacancy-meta">
                                <div class="meta-item">
                                    <i class="material-icons">business</i>
                                    <span>${vacancy.company}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="material-icons">location_on</i>
                                    <span>${vacancy.full_location || vacancy.location}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="material-icons">work</i>
                                    <span>${vacancy.employmentTypeText}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="material-icons">timeline</i>
                                    <span>${vacancy.experienceText}</span>
                                </div>
                            </div>
                            <div class="vacancy-description">
                                <p>${vacancy.shortDescription}</p>
                            </div>
                            <div class="vacancy-footer">
                                <div class="footer-left">
                                    <span class="post-date">Опубликовано: ${vacancy.formatted_date}</span>
                                </div>
                                <div class="footer-right">
                                    <a href="/vacancies/${vacancy.vacancyid}" class="btn waves-effect">Подробнее</a>
                                    ${data.isAuth ? `
                                        ${vacancy.userid === (data.user ? data.user.userid : null) ? `
                                            <a href="/vacancies/${vacancy.vacancyid}/edit?allow=true" class="btn grey lighten-1">Редактировать</a>
                                        ` : `
                                            <form action="/favourite/add" method="POST" class="inline-form">
                                                <input type="hidden" name="_csrf" value="${data._csrf}">
                                                <input type="hidden" name="id" value="${vacancy.vacancyid}">
                                                <button type="submit" class="btn pink lighten-1">В избранное</button>
                                            </form>
                                        `}
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${renderPagination(data.pagination)}
            `;

            initPaginationHandlers();
        } else {
            vacanciesContainer.innerHTML = `
                <div class="empty-state">
                    <h4>Вакансий не найдено</h4>
                    ${data.isAuth ? `
                        <a href="/add" class="btn-large waves-effect waves-light">Добавить вакансию</a>
                    ` : ''}
                </div>
            `;
        }
    }

    function initPaginationHandlers() {
        document.querySelectorAll('.pagination a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page')) || 
                             parseInt(this.textContent) || 
                             (this.querySelector('i').classList.contains('chevron_left') ? currentPage - 1 : currentPage + 1);
                changePage(page);
            });
        });
    }
    
    function renderPagination(pagination) {
        if (pagination.totalPages <= 1) return '';
        
        const startPage = Math.max(1, Math.min(
            pagination.page - 2,
            pagination.totalPages - 4
        ));
        const endPage = Math.min(pagination.totalPages, startPage + 4);
        
        let pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return `
            <div class="row">
                <div class="col s12 center-align">
                    <ul class="pagination">
                        <li class="${pagination.hasPrev ? 'waves-effect' : 'disabled'}">
                            <a href="#!" data-page="${pagination.page - 1}">
                                <i class="material-icons">chevron_left</i>
                            </a>
                        </li>
                        
                        ${pages.map(pageNum => `
                            <li class="${pageNum === pagination.page ? 'active' : 'waves-effect'}">
                                <a href="#!" data-page="${pageNum}">${pageNum}</a>
                            </li>
                        `).join('')}
                        
                        ${pagination.totalPages > endPage ? `
                            <li class="disabled"><a href="#!">...</a></li>
                            <li class="waves-effect">
                                <a href="#!" data-page="${pagination.totalPages}">${pagination.totalPages}</a>
                            </li>
                        ` : ''}
                        
                        <li class="${pagination.hasNext ? 'waves-effect' : 'disabled'}">
                            <a href="#!" data-page="${pagination.page + 1}">
                                <i class="material-icons">chevron_right</i>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    function changePage(page) {
        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        params.page = page;
        loadVacancies(params);
    }
    
    // Обработка формы фильтрации
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(filterForm);
        const params = Object.fromEntries(formData.entries());
        params.page = 1;
        loadVacancies(params);
    });
    
    // Обработка сброса формы
    filterForm.addEventListener('reset', function() {
        // Даем время на сброс значений формы
        setTimeout(() => {
            const params = {
                page: 1
            };
            loadVacancies(params);
        }, 10);
    });
    
    // Первоначальная загрузка с параметрами из URL
    const initialParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    loadVacancies(initialParams);
});



M.Tabs.init(document.querySelectorAll('.tabs'));

