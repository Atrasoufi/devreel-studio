import { PresetTopic } from '../types';

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: 'django-n-plus-one',
    title: 'Django N+1 Query: select_related vs prefetch_related',
    technology: 'Django',
    shortDesc: 'Stop crashing your PostgreSQL database with 100 extra queries in Django templates or DRF serializers.',
    suggestedDuration: 45,
    notes: `The N+1 query problem occurs when Django executes 1 query to fetch a parent list (e.g., 50 Articles), and then performs 50 separate SQL queries inside a loop or serializer to fetch each author.
Key distinction:
1. select_related: uses SQL JOIN (INNER JOIN / LEFT OUTER JOIN). Best for ForeignKey and OneToOneField (single object relationships).
2. prefetch_related: executes 2 separate queries and joins them in Python memory. Best for ManyToManyField and reverse ForeignKey (lists of objects).`,
    codeSnippet: `# ❌ BAD: Causes 1 + 50 SQL queries!
books = Book.objects.all()
for book in books:
    print(book.author.name)  # Hits database every time!

# ✅ GOOD: Exactly 1 SQL query with JOIN
books = Book.objects.select_related("author").all()`
  },
  {
    id: 'django-atomic-transactions',
    title: 'Prevent Race Conditions with transaction.atomic()',
    technology: 'Django',
    shortDesc: 'How to handle e-commerce wallet deductions and inventory locks without losing customer money.',
    suggestedDuration: 45,
    notes: `When two concurrent requests hit an API endpoint at the same millisecond (e.g. transfer money or reserve ticket), Django can read stale data and cause double spending.
Solutions:
1. wrap the database operations in \`with transaction.atomic():\`
2. use \`select_for_update()\` on QuerySets to issue a PostgreSQL row-level lock (SELECT ... FOR UPDATE).
3. Always update using F() expressions or atomic locks.`,
    codeSnippet: `from django.db import transaction

def transfer_funds(sender_id, receiver_id, amount):
    with transaction.atomic():
        # Row-level lock prevents race conditions
        sender = Wallet.objects.select_for_update().get(id=sender_id)
        if sender.balance < amount:
            raise ValueError("Insufficient balance")
        
        sender.balance -= amount
        sender.save()
        
        Wallet.objects.filter(id=receiver_id).update(
            balance=F("balance") + amount
        )`
  },
  {
    id: 'python-mutable-default-trap',
    title: 'Python Mutable Default Arguments Trap',
    technology: 'Python',
    shortDesc: 'Why `def add_item(item, bucket=[])` silently shares state between all users in production.',
    suggestedDuration: 35,
    notes: `In Python, default parameter expressions are evaluated ONCE when the function definition is executed at module load time, NOT each time the function is called.
Therefore, if you pass a mutable object like a list \`[]\` or dict \`{}\` as a default argument, all callers share the exact same instance in memory!
Solution:
Always default to \`None\` and initialize inside the function: \`if items is None: items = []\`.`,
    codeSnippet: `# ❌ DANGEROUS: 'items' is created only once in memory!
def register_student(name, courses=[]):
    courses.append("Backend 101")
    return courses

# ✅ CORRECT: Pure & safe function
def register_student_safe(name, courses=None):
    if courses is None:
        courses = []
    courses.append("Backend 101")
    return courses`
  },
  {
    id: 'drf-serializer-validation',
    title: 'DRF Custom Validation: field-level vs object-level',
    technology: 'Django REST Framework',
    shortDesc: 'Writing clean, testable business validations in Django REST Framework serializers.',
    suggestedDuration: 45,
    notes: `In Django REST Framework:
1. Field-level validation: naming convention \`validate_<fieldname>(self, value)\`. Handles sanitization and single field logic.
2. Object-level validation: \`validate(self, data)\`. Handles cross-field rules (e.g. \`start_date < end_date\`, or password confirmation match).
3. Always raise \`serializers.ValidationError\`, never standard Python exceptions.`,
    codeSnippet: `class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["check_in", "check_out", "guest_count"]

    def validate_guest_count(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Guest count must be between 1 and 10.")
        return value

    def validate(self, attrs):
        if attrs["check_in"] >= attrs["check_out"]:
            raise serializers.ValidationError({"check_out": "Check-out must be after check-in."})
        return attrs`
  },
  {
    id: 'sql-postgres-indexing',
    title: 'PostgreSQL B-Tree vs GIN Indexing for Django',
    technology: 'PostgreSQL & SQL',
    shortDesc: 'Turn a 1200ms slow query into a 4ms lightning-fast lookup using proper Django db_index.',
    suggestedDuration: 40,
    notes: `When querying high-volume tables (over 100k rows), sequential table scans kill database performance.
In Django:
- B-Tree (default): best for equality, range queries, and order by (\`created_at\`, \`status\`, \`email\`).
- GIN (Generalized Inverted Index): essential for JSONField lookups (\`metadata__tag="python"\`) and Full-Text Search.
Use \`models.Index(fields=['tenant', '-created_at'])\` for compound filtering.`,
    codeSnippet: `from django.db import models
from django.contrib.postgres.indexes import GinIndex

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    extra_data = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            GinIndex(fields=["extra_data"]),
        ]`
  },
  {
    id: 'docker-django-multistage',
    title: 'Docker Multi-stage Build for Django',
    technology: 'Docker & Linux',
    shortDesc: 'Slash your Django Docker image from 1.2 GB down to 140 MB with multi-stage builds.',
    suggestedDuration: 45,
    notes: `Why multi-stage?
Compiling C-extensions (psycopg2, cryptography) requires gcc, python3-dev, libpq-dev.
Leaving build tools in the final image creates huge security vulnerabilities and bloats image size.
With multi-stage, compile wheels in the 'builder' stage, and copy only the wheels into a clean slim image!`,
    codeSnippet: `# Stage 1: Build wheels with compiler
FROM python:3.12-slim AS builder
RUN apt-get update && apt-get install -y gcc libpq-dev
RUN pip wheel --no-cache-dir --wheel-dir /wheels psycopg2-binary django

# Stage 2: Clean, small production image
FROM python:3.12-slim
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /wheels /wheels
RUN pip install --no-cache /wheels/*`
  }
];

export const DEFAULT_INITIAL_REEL: import('../types').ReelPackage = {
  id: 'reel-initial-demo',
  title: 'Django N+1 Query Problem: راز پنهان کند شدن دیتابیس!',
  technology: 'Django',
  targetDurationSeconds: 45,
  summary: 'آموزش سریع و کاربردی حل مشکل N+1 Query در جنگو با استفاده از select_related و تفاوت آن با prefetch_related در ۴۵ ثانیه.',
  hook: {
    persian: 'دیتابیس پروژه‌ت کند شده و نمیدونی چرا؟ احتمالاً داری بدون اینکه بدونی ۵۰ تا کوئری اضافه می‌زنی!',
    english: 'Are N+1 queries secretly killing your Django backend performance?',
    visualCue: 'نمایش شمارنده کوئری جنگو که با هر لوپ از ۱ تا ۱۰۰ بالا میرود با هشدار قرمز'
  },
  scenes: [
    {
      sceneNumber: 1,
      durationSeconds: 7,
      visualType: 'callout_card',
      visualDescription: 'صفحه دارک با متن قلاب و ایمپکت قرمز روی تعداد کوئری‌ها. عنوان انگلیسی N+1 Query Trap نمایش داده می‌شود.',
      persianNarration: 'یکی از بزرگ‌ترین دلایل کند شدن سایت‌های جنگویی، فاجعه‌ای به اسم N+1 Query هستش! بیا تا نشونت بدم چطور توی ۳ ثانیه حلش کنی.',
      englishNarrationTerms: ['N+1 Query', 'Django ORM', 'Database'],
      onScreenTitlePersian: 'چرا دیتابیس جنگو کند میشه؟',
      onScreenTitleEnglish: 'The Silent N+1 Killer',
      codeSnippet: `# ❌ کد خطرناک: برای هر کتاب یک کوئری به دیتابیس می‌زنه!
books = Book.objects.all()
for book in books:
    # 50 کتاب = 51 کوئری SQL!
    print(book.author.name)`,
      codeLanguage: 'python',
      highlightLines: [3, 4],
      animationNote: 'کد با افکت تایپ لرزان ظاهر می‌شود و خط ۴ با نور نئونی قرمز هایلایت می‌شود.',
      subtitles: [
        { startSecond: 0, endSecond: 3.5, persianText: 'یکی از بزرگ‌ترین دلایل کند شدن پروژه‌های جنگو...', englishKeywords: 'N+1 Query Problem' },
        { startSecond: 3.5, endSecond: 7, persianText: 'مشکلی به اسم N+1 هست که سرور رو نابود می‌کنه!', englishKeywords: 'Database Bottleneck' }
      ]
    },
    {
      sceneNumber: 2,
      durationSeconds: 12,
      visualType: 'code_editor',
      visualDescription: 'کد ادیتور دارک با نام فایل views.py. مقایسه کد غلط با ارور دیتابیس و لاگ SQL در ترمینال.',
      persianNarration: 'وقتی تمام کتاب‌ها رو می‌گیری و توی یک حلقه به نویسنده‌شون دسترسی پیدا می‌کنی، جنگو برای هر رکورد یک دستور SELECT اضافه به دیتابیس می‌فرسته.',
      englishNarrationTerms: ['Loop', 'Foreign Key', 'SELECT Query'],
      onScreenTitlePersian: 'فاجعه ۵۱ کوئری در یک صفحه!',
      onScreenTitleEnglish: '1 + N Separate SQL Calls',
      codeSnippet: `# ❌ اجرای 51 کوئری در پس‌زمینه:
# Query 1: SELECT * FROM books;
# Query 2: SELECT * FROM authors WHERE id=1;
# Query 3: SELECT * FROM authors WHERE id=2;
# ... تکرار تا بی‌نهایت!`,
      codeLanguage: 'sql',
      highlightLines: [2, 3, 4],
      animationNote: 'خطوط کوئری‌ها یکی پس از دیگری با سرعت بالا زیر هم چشمک می‌زنند تا بار سنگین را تداعی کنند.',
      subtitles: [
        { startSecond: 7, endSecond: 13, persianText: 'وقتی توی حلقه به نویسنده هر کتاب دسترسی پیدا می‌کنی...', englishKeywords: 'Looping ForeignKeys' },
        { startSecond: 13, endSecond: 19, persianText: 'جنگو برای هر سطر یک کوئری جدید به دیتابیس می‌فرسته!', englishKeywords: 'Separate SELECT Calls' }
      ]
    },
    {
      sceneNumber: 3,
      durationSeconds: 14,
      visualType: 'code_editor',
      visualDescription: 'نمایش راه‌حل حرفه‌ای با متد select_related و تبدیل ۵۱ کوئری به دقیقاً ۱ کوئری فوق‌سریع با JOIN.',
      persianNarration: 'راه‌حل طلایی: فقط کافیه متد select_related رو اضافه کنی! این متد در سطح اس‌کیو‌ال یک JOIN می‌زنه و تمام اطلاعات رو با یک کوئری دریافت می‌کنه.',
      englishNarrationTerms: ['select_related', 'INNER JOIN', 'QuerySet Cache'],
      onScreenTitlePersian: 'راه‌حل جادویی: تبدیل به ۱ کوئری!',
      onScreenTitleEnglish: 'Solution: select_related()',
      codeSnippet: `# ✅ راه‌حل حرفه‌ای: فقط ۱ کوئری با SQL JOIN!
books = Book.objects.select_related("author").all()

for book in books:
    # نویسنده از قبل کش شده و دیتابیس دست‌نخورده می‌مونه!
    print(book.author.name)`,
      codeLanguage: 'python',
      highlightLines: [2, 5],
      animationNote: 'متن select_related با نئون بنفش و فیروزه‌ای درخشان برجسته می‌شود.',
      subtitles: [
        { startSecond: 19, endSecond: 26, persianText: 'کافیه select_related رو روی فیلد ForeignKey صدا بزنی.', englishKeywords: 'select_related("author")' },
        { startSecond: 26, endSecond: 33, persianText: 'دیتابیس فقط با یک کوئری تمام اطلاعات رو تحویل میده!', englishKeywords: 'Fast SQL JOIN' }
      ]
    },
    {
      sceneNumber: 4,
      durationSeconds: 12,
      visualType: 'callout_card',
      visualDescription: 'کارت خلاصه نکته سینیور با دیوایدر بنفش و فیروزه‌ای، مقایسه فرمول select_related با prefetch_related.',
      persianNarration: 'فرمول یادت باشه: برای فارن‌کی‌ها از select_related و برای روابط ManyToMany از prefetch_related استفاده کن!',
      englishNarrationTerms: ['select_related', 'prefetch_related', 'ManyToMany'],
      onScreenTitlePersian: 'فرمول طلایی توسعه‌دهنده سینیور',
      onScreenTitleEnglish: 'Pro Tip: When to use which?',
      codeSnippet: `# فرمول طلایی:
# 1. ForeignKey / OneToOne  -> select_related()
# 2. ManyToMany / Reverse FK -> prefetch_related()`,
      codeLanguage: 'python',
      highlightLines: [2, 3],
      animationNote: 'کارت مقایسه با انیمیشن فنری از پایین صفحه اسلاید می‌شود.',
      subtitles: [
        { startSecond: 33, endSecond: 39, persianText: 'برای ForeignKey از select_related استفاده کن.', englishKeywords: 'ForeignKey -> select_related' },
        { startSecond: 39, endSecond: 45, persianText: 'و برای روابط ManyToMany از prefetch_related!', englishKeywords: 'ManyToMany -> prefetch_related' }
      ]
    }
  ],
  conclusion: {
    persianTakeaway: 'با همین یک خط کد، سرعت لود صفحات و اندپوینت‌های جنگوی خودت رو تا ۱۰ برابر افزایش میدی!',
    callToActionPersian: 'این ریلز رو سیو کن تا بعداً گمش نکنی، و اگه توی پروژه‌ت با این مشکل برخورد کردی توی کامنت‌ها برام بنویس!',
    callToActionEnglish: 'Save this reel for your next Django project!'
  },
  socialExport: {
    caption: `دیتابیس پروژه‌ت توی جنگو کُند شده؟ 🐢💥
احتمالاً درگیر تله‌ی N+1 Query شدی!

وقتی توی تمپلیت یا سریالایزر لوپ می‌زنی و به ForeignKey دسترسی داری، جنگو برای هر آیتم یک کوئری جداگانه به دیتابیس می‌فرسته (مثلاً ۵۰ کتاب = ۵۱ کوئری!).

راه‌حل ساده و طلایی:
۱. برای فیلدهای ForeignKey یا OneToOne:
کافیه از select_related استفاده کنی تا با یک SQL JOIN سریع، همه داده‌ها یکجا لود بشن.

۲. برای روابط چندبه‌چند (ManyToMany):
از متد prefetch_related استفاده کن.

📌 این پست رو ذخیره (Save) کن تا زمان پیاده‌سازی بک‌اند دم دستت باشه!
💬 کلمه "جنگو" رو کامنت کن تا نکات بهینه‌سازی دیتابیس رو برات بفرستم.`,
    hashtags: [
      '#پایتون', '#جنگو', '#برنامه_نویسی', '#توسعه_وب', '#بک_اند',
      '#python', '#django', '#djangorestframework', '#postgresql', '#backenddeveloper',
      '#codingtips', '#webdevelopment', '#sqltips', '#softwareengineering'
    ]
  },
  createdAt: new Date().toISOString()
};
