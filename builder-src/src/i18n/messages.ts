// All user-facing builder strings. TypeScript enforces EN/TR key parity
// (tr is typed against the en key set); the placeholder-parity test guards
// {param} tokens. Set-type and sync terminology matches the mobile app's
// Turkish localization (app_tr.arb).

const en = {
  // App shell
  configMissingTitle: "Configuration missing",
  configMissingBody:
    "This build is missing required configuration values: {keys}. The builder cannot start without them.",
  checkingSession: "Checking your session…",
  signOut: "Sign out",

  // Login
  loginTitle: "Routine Builder",
  brandMarkAlt: "THYMOS logo",
  heroBuild: "Build.",
  heroSync: "Sync.",
  heroTrain: "Train.",
  heroSub:
    "Plan your training on a real keyboard, push it to your phone, and train it anywhere.",
  loginIntro:
    "Build workout templates with a keyboard and mouse, then push them to your phone. Sign in with the same email you use for Cloud Sync in the THYMOS app (Pro).",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  sendMagicLink: "Send magic link",
  sending: "Sending…",
  magicSentTo:
    "Magic link sent to {email}. Open it on this computer to continue.",
  useDifferentEmail: "Use a different email",
  errNoAccount:
    "No THYMOS account was found for this email. The web builder is available for Pro users — first enable Cloud Sync in the THYMOS app (Settings → Sync) with this email, then try again.",
  errRateLimit:
    "Too many attempts — please wait a minute before requesting another link.",

  // "See how it works" — scroll-revealed screenshots + zoomable lightbox
  howCue: "See how it works",
  howTitle: "See how it works",
  howSub:
    "Seven screens from the builder. Click any of them to open it full size and zoom in.",
  shotOpenAria: "Open full size: {title}",
  shotWorkspaceTitle: "Your workspace",
  shotWorkspaceBody:
    "Templates on top, multi-week programs below — each tagged with where it came from.",
  shotCatalogTitle: "The exercise catalog",
  shotCatalogBody:
    "Search or filter the built-in catalog by muscle and equipment, then add with one click.",
  shotSetsTitle: "Every set, spelled out",
  shotSetsBody:
    "Warm-up or working, reps, weight, rest, RPE and RIR — typed, duplicated and reordered in seconds.",
  shotScheduleTitle: "Schedule the block",
  shotScheduleBody:
    "Drop templates onto a week × day grid, then copy week 1 across the whole program.",
  shotPushTitle: "Push to your phone",
  shotPushBody:
    "Saving queues your changes; one push sends them all and tells you exactly what landed.",
  shotBlockTitle: "A whole block in one sitting",
  shotBlockBody:
    "Thirteen changes, one push — templates and programs travel together.",
  shotDevicesTitle: "Sync, schedule, train",
  shotDevicesBody:
    "Open THYMOS, run Sync, and the plan is on your phone's calendar ready to start.",

  // Lightbox
  lbClose: "Close",
  lbPrev: "Previous screenshot",
  lbNext: "Next screenshot",
  lbZoomIn: "Zoom in",
  lbZoomOut: "Zoom out",
  lbReset: "Reset zoom",
  lbCounter: "{n} / {total}",
  lbHint: "Scroll to zoom · drag to pan · Esc to close",

  // Auth callback
  signingIn: "Signing you in…",
  completingAuth: "Completing authentication.",
  signInFailed: "Sign-in failed",
  linkNoSession:
    "The sign-in link did not produce a session. Links are single-use and expire — request a new one.",
  backToSignIn: "Back to sign-in",

  // List page
  yourTemplates: "Your Templates",
  listTagline: "Build here, push to your phone, train anywhere.",
  refresh: "Refresh",
  newTemplate: "+ New template",
  pendingHeader: "{n} change(s) waiting to be pushed to your phone:",
  pushToPhone: "Push to phone",
  pushing: "Pushing…",
  rejectedLabel: "rejected: {code}",
  pushedDone:
    "{n} change(s) pushed. Open THYMOS on your phone and run Sync to receive them.",
  pushPartial:
    "{accepted} change(s) pushed, {rejected} rejected — see details below.",
  retryInSec: "Try again in ~{s}s.",
  loadingTemplates: "Loading your templates from sync…",
  loadFailed: "Could not load templates: {message}",
  retry: "Retry",
  emptyTemplates:
    "No templates yet. Create your first one — it will appear on your phone after you push and sync.",
  exercisesCount: "{n} exercises",
  originWeb: "web",
  originPhone: "phone",
  originWatch: "watch",
  notPushedYet: "not pushed yet",
  edit: "Edit",
  deleteLabel: "Delete",
  deleteTemplateConfirm:
    'Delete "{name}"? The deletion is applied to your phone on its next sync.',
  yourPrograms: "Your Programs",
  programsTagline:
    "Multi-week plans built from your templates (week × day schedule).",
  newProgram: "+ New program",
  emptyPrograms:
    "No programs yet. A program assigns your templates to a week-by-week schedule and guides you through it on your phone.",
  programSummary: "{w} weeks · {s}/week · {c} sessions",
  deleteProgramConfirm:
    'Delete "{name}" and its sessions? The deletion is applied to your phone on its next sync.',

  // Template editor
  newTemplateTitle: "New Template",
  editTemplateTitle: "Edit Template",
  cancel: "Cancel",
  saveQueues: "Save (queues for push)",
  templateNameLabel: "Template name",
  templateNamePh: "e.g. Push Day A",
  validationTemplateName: "Give the template a name before saving.",
  validationAddExercise: "Add at least one exercise before saving.",
  templateNotFound:
    "Template not found. It may not have been pushed/synced yet.",
  backToList: "Back to list",
  removeExercise: "Remove exercise",
  unknownHere: "unknown here",
  unknownTooltip:
    "This exercise is not in the built-in catalog (probably a custom exercise created on your phone — custom exercises do not sync yet). It still works on your phone.",
  addSet: "+ Add set",
  duplicateSet: "Duplicate set",
  removeSet: "Remove set",
  moveSetUp: "Move set up",
  moveSetDown: "Move set down",
  thType: "Type",
  thRepsMin: "Reps min",
  thRepsMax: "Reps max",
  thWeightKg: "Weight kg",
  thTimeS: "Time s",
  thRestS: "Rest s",
  thRpe: "RPE",
  thRir: "RIR",
  thExtras: "Extras",
  dropPct: "drop %",
  dropStages: "stages",
  supersetGroup: "group",

  // Set types (display only; wire values stay canonical)
  setWarmup: "warmup",
  setWorking: "working",
  setBackoff: "back-off",
  setDropset: "drop set",
  setAmrap: "AMRAP",
  setFailure: "failure",
  setSuperset: "superset",
  setCooldown: "cooldown",

  // Exercise browser
  addExercise: "+ Add exercise",
  addExercisesTitle: "Add exercises",
  closeBrowser: "✕ Close",
  addedName: "✓ added {name}",
  searchExercisesPh: "Search exercises…",
  searchExercisesAria: "Search exercises",
  allMuscles: "All muscles",
  allEquipment: "All equipment",
  exercisesFound: "{n} exercise(s)",
  emptyBrowser:
    "Nothing matches these filters. Clear the search or filters to see the full catalog.",
  addRow: "add",

  // Program editor
  newProgramTitle: "New Program",
  editProgramTitle: "Edit Program",
  programNotFound:
    "Program not found. It may not have been pushed/synced yet.",
  programNameLabel: "Program name",
  programNamePh: "e.g. PPL 8-Week",
  descriptionLabel: "Description (optional)",
  categoryLabel: "Category",
  levelLabel: "Level",
  goalsLabel: "Goals",
  weeksLabel: "Weeks",
  sessionsPerWeekLabel: "Sessions / week",
  scheduleTitle: "Schedule",
  copyWeek1: "Copy week 1 to all weeks",
  noTemplatesWarn:
    "You have no templates yet — program days are built from your templates. Create a template first.",
  weekN: "Week {n}",
  dayN: "Day {n}",
  restOption: "— rest —",
  rxFromApp: "rx from app",
  rxTooltip:
    "This day has explicit per-session prescriptions (edited in the app). They are preserved by web edits.",
  validationProgramName: "Give the program a name before saving.",
  validationAssignDay: "Assign a template to at least one day before saving.",
  catBodybuilding: "bodybuilding",
  catPowerlifting: "powerlifting",
  catCalisthenics: "calisthenics",
  levelBeginner: "beginner",
  levelIntermediate: "intermediate",
  levelAdvanced: "advanced",
  goalHypertrophy: "hypertrophy",
  goalStrength: "strength",
  goalEndurance: "endurance",

  // Pending-change labels (visible in the push panel)
  labelSaveTemplate: 'Save template "{name}"',
  labelDeleteTemplate: 'Delete template "{name}"',
  labelSaveProgram: 'Save program "{name}"',
  labelSessionRow: '— session W{w}D{d} "{title}"',
  labelRemoveSession: "— remove session no longer in the plan",
  labelDeleteProgram: 'Delete program "{name}"',
  labelDeleteItsSession: "— delete its session",

  // Sync client errors
  errSessionExpired: "Your session expired. Sign in again.",
  errNetworkFailed: "Network request failed.",
} as const;

export type MessageKey = keyof typeof en;
export type Locale = "en" | "tr";

const tr: Record<MessageKey, string> = {
  configMissingTitle: "Yapılandırma eksik",
  configMissingBody:
    "Bu derlemede gerekli yapılandırma değerleri eksik: {keys}. Oluşturucu bunlar olmadan başlayamaz.",
  checkingSession: "Oturumun kontrol ediliyor…",
  signOut: "Çıkış yap",

  loginTitle: "Rutin Oluşturucu",
  brandMarkAlt: "THYMOS logosu",
  heroBuild: "Oluştur.",
  heroSync: "Senkronize et.",
  heroTrain: "Antrenman yap.",
  heroSub:
    "Antrenmanını gerçek bir klavyeyle planla, telefonuna gönder ve her yerde çalış.",
  loginIntro:
    "Antrenman şablonlarını klavye ve fareyle oluştur, sonra telefonuna gönder. THYMOS uygulamasında Bulut Senkronizasyonu için kullandığın e-postayla giriş yap (Pro).",
  emailLabel: "E-posta",
  emailPlaceholder: "sen@ornek.com",
  sendMagicLink: "Giriş bağlantısı gönder",
  sending: "Gönderiliyor…",
  magicSentTo:
    "Giriş bağlantısı {email} adresine gönderildi. Devam etmek için bu bilgisayarda aç.",
  useDifferentEmail: "Farklı bir e-posta kullan",
  errNoAccount:
    "Bu e-posta için THYMOS hesabı bulunamadı. Web oluşturucu Pro kullanıcılar içindir — önce THYMOS uygulamasında bu e-postayla Bulut Senkronizasyonu'nu aç (Ayarlar → Senkronizasyon), sonra tekrar dene.",
  errRateLimit:
    "Çok fazla deneme — yeni bir bağlantı istemeden önce bir dakika bekle.",

  howCue: "Nasıl çalıştığını gör",
  howTitle: "Nasıl çalıştığını gör",
  howSub:
    "Oluşturucudan yedi ekran. Tam boyutta açıp yakınlaştırmak için herhangi birine tıkla.",
  shotOpenAria: "Tam boyutta aç: {title}",
  shotWorkspaceTitle: "Çalışma alanın",
  shotWorkspaceBody:
    "Üstte şablonlar, altta çok haftalık programlar — her biri nereden geldiği etiketiyle.",
  shotCatalogTitle: "Egzersiz kataloğu",
  shotCatalogBody:
    "Yerleşik katalogda kasa ve ekipmana göre ara veya filtrele, tek tıkla ekle.",
  shotSetsTitle: "Her set açıkça",
  shotSetsBody:
    "Isınma ya da çalışma, tekrar, ağırlık, dinlenme, RPE ve RIR — saniyeler içinde yaz, çoğalt, sırala.",
  shotScheduleTitle: "Bloğu planla",
  shotScheduleBody:
    "Şablonları hafta × gün takvimine yerleştir, sonra 1. haftayı tüm programa kopyala.",
  shotPushTitle: "Telefonuna gönder",
  shotPushBody:
    "Kaydetmek değişiklikleri sıraya alır; tek gönderim hepsini yollar ve neyin ulaştığını söyler.",
  shotBlockTitle: "Tek oturuşta koca bir blok",
  shotBlockBody:
    "On üç değişiklik, tek gönderim — şablonlar ve programlar birlikte gider.",
  shotDevicesTitle: "Senkronize et, planla, çalış",
  shotDevicesBody:
    "THYMOS'u aç, Senkronizasyon'u çalıştır; plan telefonunun takviminde başlamaya hazır.",

  lbClose: "Kapat",
  lbPrev: "Önceki ekran görüntüsü",
  lbNext: "Sonraki ekran görüntüsü",
  lbZoomIn: "Yakınlaştır",
  lbZoomOut: "Uzaklaştır",
  lbReset: "Yakınlaştırmayı sıfırla",
  lbCounter: "{n} / {total}",
  lbHint: "Yakınlaştırmak için kaydır · sürükleyerek gez · kapatmak için Esc",

  signingIn: "Giriş yapılıyor…",
  completingAuth: "Kimlik doğrulama tamamlanıyor.",
  signInFailed: "Giriş başarısız",
  linkNoSession:
    "Giriş bağlantısı bir oturum oluşturmadı. Bağlantılar tek kullanımlıktır ve süresi dolar — yenisini iste.",
  backToSignIn: "Girişe dön",

  yourTemplates: "Şablonların",
  listTagline: "Burada oluştur, telefonuna gönder, her yerde antrenman yap.",
  refresh: "Yenile",
  newTemplate: "+ Yeni şablon",
  pendingHeader: "Telefonuna gönderilmeyi bekleyen {n} değişiklik:",
  pushToPhone: "Telefona Gönder",
  pushing: "Gönderiliyor…",
  rejectedLabel: "reddedildi: {code}",
  pushedDone:
    "{n} değişiklik gönderildi. Telefonunda THYMOS'u aç ve almak için Senkronizasyon'u çalıştır.",
  pushPartial:
    "{accepted} değişiklik gönderildi, {rejected} reddedildi — ayrıntılar aşağıda.",
  retryInSec: "~{s} sn sonra tekrar dene.",
  loadingTemplates: "Şablonların senkronizasyondan yükleniyor…",
  loadFailed: "Şablonlar yüklenemedi: {message}",
  retry: "Tekrar dene",
  emptyTemplates:
    "Henüz şablon yok. İlkini oluştur — gönderip senkronize ettikten sonra telefonunda görünecek.",
  exercisesCount: "{n} egzersiz",
  originWeb: "web",
  originPhone: "telefon",
  originWatch: "saat",
  notPushedYet: "henüz gönderilmedi",
  edit: "Düzenle",
  deleteLabel: "Sil",
  deleteTemplateConfirm:
    '"{name}" silinsin mi? Silme işlemi bir sonraki senkronizasyonda telefonuna uygulanır.',
  yourPrograms: "Programların",
  programsTagline:
    "Şablonlarından oluşturulan çok haftalık planlar (hafta × gün takvimi).",
  newProgram: "+ Yeni program",
  emptyPrograms:
    "Henüz program yok. Program, şablonlarını haftalık bir takvime yerleştirir ve telefonunda sana yol gösterir.",
  programSummary: "{w} hafta · haftada {s} · {c} seans",
  deleteProgramConfirm:
    '"{name}" ve seansları silinsin mi? Silme işlemi bir sonraki senkronizasyonda telefonuna uygulanır.',

  newTemplateTitle: "Yeni Şablon",
  editTemplateTitle: "Şablonu Düzenle",
  cancel: "Vazgeç",
  saveQueues: "Kaydet (gönderim için sıraya al)",
  templateNameLabel: "Şablon adı",
  templateNamePh: "örn. İtiş Günü A",
  validationTemplateName: "Kaydetmeden önce şablona bir ad ver.",
  validationAddExercise: "Kaydetmeden önce en az bir egzersiz ekle.",
  templateNotFound:
    "Şablon bulunamadı. Henüz gönderilmemiş/senkronize edilmemiş olabilir.",
  backToList: "Listeye dön",
  removeExercise: "Egzersizi kaldır",
  unknownHere: "burada bilinmiyor",
  unknownTooltip:
    "Bu egzersiz yerleşik katalogda yok (muhtemelen telefonunda oluşturulmuş özel bir egzersiz — özel egzersizler henüz senkronize edilmiyor). Telefonunda çalışmaya devam eder.",
  addSet: "+ Set ekle",
  duplicateSet: "Seti çoğalt",
  removeSet: "Seti kaldır",
  moveSetUp: "Seti yukarı taşı",
  moveSetDown: "Seti aşağı taşı",
  thType: "Tip",
  thRepsMin: "Tekrar min",
  thRepsMax: "Tekrar maks",
  thWeightKg: "Ağırlık kg",
  thTimeS: "Süre sn",
  thRestS: "Dinlenme sn",
  thRpe: "RPE",
  thRir: "RIR",
  thExtras: "Ekstra",
  dropPct: "düşüş %",
  dropStages: "aşama",
  supersetGroup: "grup",

  setWarmup: "ısınma",
  setWorking: "çalışma",
  setBackoff: "back-off",
  setDropset: "drop set",
  setAmrap: "AMRAP",
  setFailure: "tükeniş",
  setSuperset: "süperset",
  setCooldown: "soğuma",

  addExercise: "+ Egzersiz ekle",
  addExercisesTitle: "Egzersiz ekle",
  closeBrowser: "✕ Kapat",
  addedName: "✓ eklendi: {name}",
  searchExercisesPh: "Egzersiz ara…",
  searchExercisesAria: "Egzersiz ara",
  allMuscles: "Tüm kaslar",
  allEquipment: "Tüm ekipmanlar",
  exercisesFound: "{n} egzersiz",
  emptyBrowser:
    "Bu filtrelerle eşleşen yok. Tüm kataloğu görmek için aramayı veya filtreleri temizle.",
  addRow: "ekle",

  newProgramTitle: "Yeni Program",
  editProgramTitle: "Programı Düzenle",
  programNotFound:
    "Program bulunamadı. Henüz gönderilmemiş/senkronize edilmemiş olabilir.",
  programNameLabel: "Program adı",
  programNamePh: "örn. PPL 8 Hafta",
  descriptionLabel: "Açıklama (isteğe bağlı)",
  categoryLabel: "Kategori",
  levelLabel: "Seviye",
  goalsLabel: "Hedefler",
  weeksLabel: "Hafta",
  sessionsPerWeekLabel: "Seans / hafta",
  scheduleTitle: "Takvim",
  copyWeek1: "1. haftayı tüm haftalara kopyala",
  noTemplatesWarn:
    "Henüz şablonun yok — program günleri şablonlarından oluşturulur. Önce bir şablon oluştur.",
  weekN: "Hafta {n}",
  dayN: "Gün {n}",
  restOption: "— dinlenme —",
  rxFromApp: "uygulamadan reçete",
  rxTooltip:
    "Bu günün uygulamada düzenlenmiş özel seans reçeteleri var. Web düzenlemeleri bunları korur.",
  validationProgramName: "Kaydetmeden önce programa bir ad ver.",
  validationAssignDay: "Kaydetmeden önce en az bir güne şablon ata.",
  catBodybuilding: "vücut geliştirme",
  catPowerlifting: "powerlifting",
  catCalisthenics: "kalistenik",
  levelBeginner: "başlangıç",
  levelIntermediate: "orta",
  levelAdvanced: "ileri",
  goalHypertrophy: "hipertrofi",
  goalStrength: "kuvvet",
  goalEndurance: "dayanıklılık",

  labelSaveTemplate: '"{name}" şablonunu kaydet',
  labelDeleteTemplate: '"{name}" şablonunu sil',
  labelSaveProgram: '"{name}" programını kaydet',
  labelSessionRow: '— seans H{w}G{d} "{title}"',
  labelRemoveSession: "— planda olmayan seansı kaldır",
  labelDeleteProgram: '"{name}" programını sil',
  labelDeleteItsSession: "— seansını sil",

  errSessionExpired: "Oturumun süresi doldu. Tekrar giriş yap.",
  errNetworkFailed: "Ağ isteği başarısız oldu.",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, tr };
