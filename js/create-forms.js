import { CLEARANCE_LEVELS, STATUSES, createItem, uploadFile } from "./archive.js";
import { showToast, getCurrentProfile } from "./app.js";
import { setNoisePaused } from "./effects.js";

const SECTION_CONFIG = {
  documents: {
    title: "Создать документ",
    icon: "&#128196;",
    fields: [
      { id: "f_title", label: "Название документа", type: "text", required: true, placeholder: "Приказ №..., Отчёт о..., Записка..." },
      { id: "f_number", label: "Номер документа", type: "text", placeholder: "DOC-2024-001" },
      { id: "f_author", label: "Автор документа", type: "text", placeholder: "Фамилия И.О." },
      { id: "f_desc", label: "Аннотация", type: "textarea", placeholder: "Краткое описание документа" },
      { id: "f_body", label: "Текст документа", type: "textarea-long", placeholder: "Полный текст документа..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Прикрепить файл (PDF / скан)", type: "file", accept: ".pdf,image/*" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      documentNumber: form.f_number.value,
      documentAuthor: form.f_author.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  photos: {
    title: "Добавить фото",
    icon: "&#128247;",
    fields: [
      { id: "f_title", label: "Название снимка", type: "text", required: true, placeholder: "Объект, место, событие..." },
      { id: "f_location", label: "Место съёмки", type: "text", placeholder: "Координаты или описание места" },
      { id: "f_date_taken", label: "Дата съёмки", type: "date" },
      { id: "f_desc", label: "Описание", type: "textarea", placeholder: "Что запечатлено на снимке..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Фотография *", type: "file", accept: "image/*", required: true }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      location: form.f_location.value,
      dateTaken: form.f_date_taken.value,
      description: form.f_desc.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  dossiers: {
    title: "Создать досье",
    icon: "&#128451;",
    fields: [
      { id: "f_title", label: "ФИО / Кодовое имя", type: "text", required: true, placeholder: "Иванов И.И. / Агент «Призрак»" },
      { id: "f_codename", label: "Позывной", type: "text", placeholder: "Позывной или псевдоним" },
      { id: "f_rank", label: "Звание / должность", type: "text", placeholder: "Капитан, Аналитик, Агент..." },
      { id: "f_affiliation", label: "Принадлежность", type: "text", placeholder: "Отдел, подразделение, организация" },
      { id: "f_status_note", label: "Текущий статус субъекта", type: "text", placeholder: "Активен / На задании / Пропал без вести" },
      { id: "f_desc", label: "Краткая биография", type: "textarea", placeholder: "Краткая информация о субъекте" },
      { id: "f_body", label: "Подробное досье", type: "textarea-long", placeholder: "Полная информация, история, заметки..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус записи", type: "status" },
      { id: "f_file", label: "Фото субъекта", type: "file", accept: "image/*" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      codename: form.f_codename.value,
      rank: form.f_rank.value,
      affiliation: form.f_affiliation.value,
      subjectStatus: form.f_status_note.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  anomalies: {
    title: "Зафиксировать аномалию",
    icon: "&#9888;",
    fields: [
      { id: "f_title", label: "Название аномалии", type: "text", required: true, placeholder: "Объект №..., Феномен «...»" },
      { id: "f_threat", label: "Класс угрозы", type: "select", options: [
        { value: "safe", label: "Безопасный" },
        { value: "euclid", label: "Нестабильный" },
        { value: "keter", label: "Опасный" },
        { value: "thaumiel", label: "Контролируемый" },
        { value: "apollyon", label: "Критический" }
      ]},
      { id: "f_location", label: "Место обнаружения", type: "text", placeholder: "Координаты или локация" },
      { id: "f_date_found", label: "Дата обнаружения", type: "date" },
      { id: "f_desc", label: "Описание явления", type: "textarea", placeholder: "Внешний вид, поведение, эффекты..." },
      { id: "f_containment", label: "Меры сдерживания", type: "textarea", placeholder: "Протокол содержания..." },
      { id: "f_body", label: "Подробное описание", type: "textarea-long", placeholder: "Полный отчёт об аномалии..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Фото / видеоматериалы", type: "file", accept: "image/*,video/mp4,video/webm" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      threatClass: form.f_threat.value,
      location: form.f_location.value,
      dateFound: form.f_date_found.value,
      description: form.f_desc.value,
      containment: form.f_containment.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  incidents: {
    title: "Добавить инцидент",
    icon: "&#128680;",
    fields: [
      { id: "f_title", label: "Название инцидента", type: "text", required: true, placeholder: "Инцидент в..., Прорыв на..." },
      { id: "f_severity", label: "Уровень угрозы", type: "select", options: [
        { value: "low", label: "Низкий — без жертв" },
        { value: "medium", label: "Средний — локальная угроза" },
        { value: "high", label: "Высокий — масштабная угроза" },
        { value: "critical", label: "Критический — катастрофа" }
      ]},
      { id: "f_location", label: "Место инцидента", type: "text", placeholder: "Локация / объект / зона" },
      { id: "f_date_incident", label: "Дата инцидента", type: "date" },
      { id: "f_casualties", label: "Потери", type: "text", placeholder: "0 / не установлено" },
      { id: "f_desc", label: "Краткое описание", type: "textarea", placeholder: "Что произошло..." },
      { id: "f_body", label: "Полный отчёт", type: "textarea-long", placeholder: "Подробности инцидента, хронология событий..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Доказательства (фото/документ)", type: "file", accept: ".pdf,image/*,video/mp4" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      severity: form.f_severity.value,
      location: form.f_location.value,
      dateIncident: form.f_date_incident.value,
      casualties: form.f_casualties.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  operations: {
    title: "Создать операцию",
    icon: "&#127919;",
    fields: [
      { id: "f_title", label: "Название операции", type: "text", required: true, placeholder: "Операция «...»" },
      { id: "f_op_code", label: "Кодовое обозначение", type: "text", placeholder: "OP-ALPHA-7" },
      { id: "f_commander", label: "Командир операции", type: "text", placeholder: "Фамилия И.О. / позывной" },
      { id: "f_date_start", label: "Дата начала", type: "date" },
      { id: "f_date_end", label: "Дата окончания", type: "date" },
      { id: "f_result", label: "Результат", type: "select", options: [
        { value: "success", label: "Успех" },
        { value: "partial", label: "Частичный успех" },
        { value: "failure", label: "Провал" },
        { value: "ongoing", label: "В процессе" },
        { value: "cancelled", label: "Отменена" }
      ]},
      { id: "f_desc", label: "Краткое описание", type: "textarea", placeholder: "Цели и задачи операции" },
      { id: "f_body", label: "Подробный отчёт", type: "textarea-long", placeholder: "Хронология операции, участники, результаты..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Материалы операции", type: "file", accept: ".pdf,image/*" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      operationCode: form.f_op_code.value,
      commander: form.f_commander.value,
      dateStart: form.f_date_start.value,
      dateEnd: form.f_date_end.value,
      result: form.f_result.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  personnel: {
    title: "Добавить сотрудника",
    icon: "&#128100;",
    fields: [
      { id: "f_title", label: "ФИО", type: "text", required: true, placeholder: "Полное имя сотрудника" },
      { id: "f_callsign", label: "Позывной", type: "text", placeholder: "Позывной в организации" },
      { id: "f_rank", label: "Звание / должность", type: "text", placeholder: "Специалист, Координатор, Капитан..." },
      { id: "f_department", label: "Отдел", type: "select", options: [
        { value: "field", label: "Полевой отдел" },
        { value: "research", label: "Исследовательский отдел" },
        { value: "security", label: "Служба безопасности" },
        { value: "analysis", label: "Аналитический отдел" },
        { value: "logistics", label: "Логистика" },
        { value: "command", label: "Командование" },
        { value: "other", label: "Другое" }
      ]},
      { id: "f_emp_status", label: "Текущий статус", type: "select", options: [
        { value: "active_duty", label: "На службе" },
        { value: "on_mission", label: "На задании" },
        { value: "leave", label: "В отпуске" },
        { value: "suspended", label: "Отстранён" },
        { value: "mia", label: "Пропал без вести" },
        { value: "kia", label: "Погиб" },
        { value: "retired", label: "В отставке" }
      ]},
      { id: "f_desc", label: "Краткая справка", type: "textarea", placeholder: "Специализация, навыки, заслуги" },
      { id: "f_body", label: "Личное дело", type: "textarea-long", placeholder: "Подробная информация..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус записи", type: "status" },
      { id: "f_file", label: "Фото сотрудника", type: "file", accept: "image/*" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      callsign: form.f_callsign.value,
      rank: form.f_rank.value,
      department: form.f_department.value,
      employeeStatus: form.f_emp_status.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  },
  timeline: {
    title: "Добавить событие",
    icon: "&#128197;",
    fields: [
      { id: "f_title", label: "Название события", type: "text", required: true, placeholder: "Название исторического события" },
      { id: "f_event_date", label: "Дата события", type: "date", required: true },
      { id: "f_event_type", label: "Тип события", type: "select", options: [
        { value: "discovery", label: "Обнаружение" },
        { value: "incident", label: "Инцидент" },
        { value: "operation", label: "Операция" },
        { value: "founding", label: "Основание" },
        { value: "breach", label: "Прорыв" },
        { value: "research", label: "Исследование" },
        { value: "other", label: "Другое" }
      ]},
      { id: "f_location", label: "Место", type: "text", placeholder: "Где произошло" },
      { id: "f_desc", label: "Краткое описание", type: "textarea", placeholder: "Что произошло..." },
      { id: "f_body", label: "Подробности", type: "textarea-long", placeholder: "Детальное описание события..." },
      { id: "f_cl", label: "Уровень допуска", type: "clearance" },
      { id: "f_st", label: "Статус", type: "status" },
      { id: "f_file", label: "Материалы", type: "file", accept: ".pdf,image/*" }
    ],
    dataMap: (form) => ({
      title: form.f_title.value,
      eventDate: form.f_event_date.value,
      eventType: form.f_event_type.value,
      location: form.f_location.value,
      description: form.f_desc.value,
      body: form.f_body.value,
      clearanceLevel: parseInt(form.f_cl.value),
      status: form.f_st.value
    })
  }
};

function buildFieldHTML(field) {
  switch (field.type) {
    case "text":
      return `<div class="form-group"><label class="form-label">${field.label}</label><input class="form-input" id="${field.id}" ${field.required ? "required" : ""} placeholder="${field.placeholder || ""}"></div>`;
    case "textarea":
      return `<div class="form-group"><label class="form-label">${field.label}</label><textarea class="form-textarea form-input" id="${field.id}" ${field.required ? "required" : ""} placeholder="${field.placeholder || ""}"></textarea></div>`;
    case "textarea-long":
      return `<div class="form-group"><label class="form-label">${field.label}</label><textarea class="form-textarea form-input" id="${field.id}" style="min-height:140px;" ${field.required ? "required" : ""} placeholder="${field.placeholder || ""}"></textarea></div>`;
    case "date":
      return `<div class="form-group"><label class="form-label">${field.label}</label><input type="date" class="form-input" id="${field.id}" ${field.required ? "required" : ""}></div>`;
    case "select":
      return `<div class="form-group"><label class="form-label">${field.label}</label><select class="form-select" id="${field.id}">${field.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}</select></div>`;
    case "clearance":
      return `<div class="form-group"><label class="form-label">${field.label}</label><select class="form-select" id="${field.id}">${Object.entries(CLEARANCE_LEVELS).map(([k, v]) => `<option value="${k}">${v.code} — ${v.name}</option>`).join("")}</select></div>`;
    case "status":
      return `<div class="form-group"><label class="form-label">${field.label}</label><select class="form-select" id="${field.id}">${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("")}</select></div>`;
    case "file":
      return `<div class="form-group"><label class="form-label">${field.label}</label><input type="file" class="form-input" id="${field.id}" accept="${field.accept || ".pdf,image/*"}" ${field.required ? "required" : ""}></div>`;
    default:
      return "";
  }
}

function openCreateForm(type, modalContainer, onCreated) {
  const config = SECTION_CONFIG[type];
  if (!config) return;

  setNoisePaused(true);

  const fieldsHTML = config.fields.map(f => buildFieldHTML(f)).join("");

  modalContainer.innerHTML = `<div class="modal-overlay active" id="createModalOverlay"><div class="modal-card">
    <button class="modal-close" id="closeCreateModal">&times;</button>
    <h2 style="font-family:var(--font-display);margin-bottom:16px;">${config.icon} ${config.title}</h2>
    <form id="createForm">
      ${fieldsHTML}
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:14px;" id="createSubmitBtn">${config.title}</button>
    </form>
  </div></div>`;

  function closeModal() {
    setNoisePaused(false);
    document.getElementById("createModalOverlay")?.remove();
  }

  document.getElementById("closeCreateModal").addEventListener("click", closeModal);
  document.getElementById("createModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "createModalOverlay") closeModal();
  });

  document.getElementById("createForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const profile = getCurrentProfile();
    if (!profile || (profile.role !== "organizer" && (profile.clearanceLevel || 1) < 4)) {
      showToast("Недостаточно прав", "error");
      return;
    }
    const btn = document.getElementById("createSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Создание...";
    try {
      const form = {};
      config.fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) form[f.id] = el;
      });
      const data = config.dataMap(form);

      const fileField = config.fields.find(f => f.type === "file");
      if (fileField) {
        const fileEl = document.getElementById(fileField.id);
        const file = fileEl?.files[0];
        if (file) {
          const url = await uploadFile(file, type);
          if (file.type.startsWith("image/")) data.imageUrl = url;
          else if (file.type.startsWith("video/")) data.videoUrl = url;
          else data.attachments = [url];
        }
      }

      await createItem(type, data, profile.uid);
      showToast("Запись создана", "success");
      closeModal();
      if (onCreated) onCreated();
    } catch (err) {
      showToast("Ошибка: " + err.message, "error");
      btn.disabled = false;
      btn.textContent = config.title;
    }
  });
}

export { SECTION_CONFIG, openCreateForm, setNoisePaused };
