if (!customElements.get("filter-based-results")) {
    class FilterBasedResults extends HTMLElement {
        constructor() {
            super();

            this.form = this.querySelector("form");
            this.mobileDepartmentsList = this.form.querySelector(
                "#mobileDepartmentsList"
            );
            this.desktopDepartmentsList = this.form.querySelectorAll(
                ".desktop-departments-select .option"
            );
            this.desktopDepartmentsBtn = this.form.querySelector(
                "#desktopDepartmentsAction"
            );
            this.optionsSelect = this.form.querySelector("#options-list");

            this.data = this.fetchFiltersJsonData();

            this.bindEvents();
        }

        fetchFiltersJsonData() {
            const json = document.getElementById("department-filters-data");
            return JSON.parse(json?.textContent);
        }

        bindEvents() {
            // mobile screen event
            this.mobileDepartmentsList.addEventListener("change", (e) => {
                const department = e.target.value;
                if (!department || !this.data[department]) {
                    this.resetOptions();
                    return;
                }
                this.form.dataset.department = department;
                this.renderOptions(department);
            });

            // desktop screen events
            this.desktopDepartmentsBtn.addEventListener(
                "click",
                this.toggleDesktopDepartmentsVisibility.bind(this)
            );
            this.desktopDepartmentsList.forEach((option) => {
                option.addEventListener("click", (event) => {
                    event.preventDefault();

                    const option = event.target.closest(".option");
                    const department = option?.dataset?.value;

                    if (!department || !this.data[department]) {
                        this.resetOptions();
                        return;
                    }

                    this.toggleActiveOption(option);
                    this.renderOptions(department);
                });
            });

            // update action state
            this.optionsSelect.addEventListener(
                "change",
                this.toggleAction.bind(this)
            );

            // submit form
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();

                const url = this.getActionUrl();
                if (!url) return;

                window.location.href = url;
            });
        }

        toggleDesktopDepartmentsVisibility(e) {
            const departments = this.form.querySelector(
                ".desktop-departments-select"
            );
            const wrapper = departments.querySelector(".wrapper-options");
            e.preventDefault();

            wrapper.classList.toggle("visible");
        }

        toggleAction(e) {
            const wrapper = this.form.querySelector(".wrapper-options");
            wrapper.classList.remove("visible");

            const optionValue = e.target?.value;
            this.updateActionState(optionValue);
        }

        updateActionState(value) {
            const action = this.form.querySelector('button[type="submit"]');

            if (!this.isValidSelection(value)) {
                action.setAttribute("disabled", true);
                return;
            }

            action.removeAttribute("disabled");
        }

        getActionUrl() {
            const department = this.form?.dataset?.department;
            if (!department) return null;

            const selectedOption = this.optionsSelect.selectedOptions[0];
            // base collection URL
            const baseUrl = `/collections/${department}`;

            const optionName = selectedOption?.dataset?.optionName;
            const optionValue = selectedOption?.value;

            if (!optionName || !optionValue) return baseUrl;

            // normalize option name
            const normalizedOptionName = optionName
                .toLowerCase()
                .replace(/\s+/g, "-");

            return `${baseUrl}?filter.v.option.${encodeURIComponent(
                normalizedOptionName
            )}=${encodeURIComponent(optionValue)}`;
        }

        isValidSelection(option) {
            return option && option !== "choose option";
        }

        resetOptions() {
            this.optionsSelect.innerHTML = `
        <option value="choose option" class="text-center">
          ${this.optionsSelect.options[0].text}
        </option>
      `;
        }

        renderOptions(departmentHandle) {
            this.resetOptions();
            this.updateActionState(
                this.optionsSelect.options[0]?.text.toLowerCase()
            );

            const departmentData = this.data[departmentHandle];
            if (!departmentData || !departmentData.options) {
                return;
            }

            departmentData.options.forEach((opt) => {
                const option = document.createElement("option");
                option.value = opt.handle;
                option.dataset.optionName = opt.name;
                option.textContent = `${opt.name} - ${opt.value}`;
                this.optionsSelect.appendChild(option);
            });

            this.optionsSelect.disabled = false;
        }

        toggleActiveOption(opt) {
            const departmentBtn = this.form.querySelector(
                "#desktopDepartmentsAction"
            );
            departmentBtn.textContent =
                opt?.dataset?.title || "Choose department";

            // selected department
            this.form.dataset.department = opt?.dataset?.value;

            this.desktopDepartmentsList.forEach((option) => {
                if (option?.dataset?.index === opt?.dataset?.index)
                    option.classList.add("active");
                else option.classList.remove("active");
            });
        }
    }

    customElements.define("filter-based-results", FilterBasedResults);
}
