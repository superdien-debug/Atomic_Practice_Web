/**
 * i18n/translations.ts
 * All app strings in English (en) and Vietnamese (vi).
 * Add new keys here as needed; TypeScript will warn if a key is missing in any language.
 */

export type Lang = 'en' | 'vi';

const translations = {
    en: {
        // ── Common ─────────────────────────────────────────────────────────────
        save: 'Save',
        cancel: 'Cancel',
        ok: 'OK',
        error: 'Error',
        loading: 'Loading...',
        back: 'Back',
        signOut: 'Sign Out',
        yes: 'Yes',
        no: 'No',

        // ── Auth ───────────────────────────────────────────────────────────────
        welcomeBack: 'Welcome Back',
        continueYour: 'Continue your practice.',
        emailAddress: 'Email Address',
        password: 'Password',
        forgotPassword: 'Forgot?',
        signIn: 'SIGN IN',
        newToPath: 'New to the path?',
        joinSangha: 'Join the Sangha',
        alreadyOnPath: 'Already on the path?',
        joinSanghaTitle: 'Join the Sangha',
        beginPractice: 'Begin your practice today.',
        createAccount: 'CREATE ACCOUNT',
        checkEmail: 'Check your email',
        emailVerify: 'We sent a verification link to your inbox.',
        fillAllFields: 'Please fill in all fields',
        pwMinLength: 'Password must be at least 6 characters',

        // ── Welcome Screen ─────────────────────────────────────────────────────
        welcomeTitle: 'Maratika',
        enterPractice: 'ENTER PRACTICE',
        establishedIn: 'ESTABLISHED IN WISDOM',
        tagline: '"Tiny Changes, Remarkable Results"',

        // ── Nav Tabs ───────────────────────────────────────────────────────────
        tabHome: 'Home',
        tabPractice: 'Practice',
        tabNews: 'News',
        tabChallenges: 'Challenges',
        tabAccount: 'Account',

        // ── Dashboard ──────────────────────────────────────────────────────────
        dashboardTitle: 'Dashboard',
        todaysPractice: "Today's Practice",
        progress: 'Progress',
        streak: 'Streak',
        totalCount: 'Total Count',
        leaderboard: 'Leaderboard',
        topPractitioners: 'Top Practitioners',

        // ── Practice ───────────────────────────────────────────────────────────
        practiceTitle: 'Practice',
        myPractices: 'My Practices',
        allPractices: 'All Practices',
        details: 'Details',
        chat: 'Chat',
        join: 'Join',
        addToMyPlan: 'Add to My Plan',
        rulesOfEngagement: 'Rules of Engagement',
        completedBy: 'Completed By',
        sangha: 'Sangha',
        group: 'Group',
        noMessages: 'No messages yet. Start the conversation! 🙏',
        createPractice: 'Create Practice',
        tabAPLibrary: 'AP Library',
        participants: 'Participants',

        // ── Challenge ─────────────────────────────────────────────────────────
        challenges: 'Challenges',
        createChallenge: 'Create Challenge',
        launchChallenge: 'LAUNCH CHALLENGE',
        saveAsDraft: 'Save as Draft',
        difficulty: 'Difficulty',
        duration: 'Duration (Days)',
        goal: 'Goal (Accumulation)',
        startDate: 'Start Date',
        target: 'Target',
        joinChallenge: 'Join Challenge 🙏',
        markAsDone: 'Mark as Done',
        challengeLaunched: 'Challenge Launched!',
        broadcastToSangha: 'Your challenge has been broadcast to the Sangha!',

        // ── Account ───────────────────────────────────────────────────────────
        accountTitle: 'Account',
        profile: 'Profile',
        displayName: 'Display Name',
        dharmaName: 'Dharma Name',
        dayStreak: 'Day Streak',
        totalPractices: 'Total Practices',
        notifications: 'Notifications',
        privacyData: 'Privacy & Data',
        language: 'Language',
        signOutConfirm: 'Are you sure you want to sign out?',
        appVersion: 'Maratika Practice v1.0.0 (Alpha)',

        // ── Language ──────────────────────────────────────────────────────────
        selectLanguage: 'Select Language',
        english: 'English',
        vietnamese: 'Tiếng Việt',
        languageChanged: 'Language Changed',
        languageChangedMsg: 'App language updated to English.',

        // ── Micro Learning ───────────────────────────────────────────────────
        learned: 'Learned',
        notLearned: 'Not Learned',
        locked: 'Locked',
        unlockLesson: 'Unlock Lesson',
        confirmUnlock: 'Do you want to use {0} M-points to unlock this lesson?',
        insufficientPoints: 'Insufficient M-points. You need {0} points.',
        markAsLearned: 'Mark as Learned',
        lessonUnlocked: 'Lesson Unlocked!',

        // ── Rebirth Game ─────────────────────────────────────────────────────
        exchanges: 'Exchanges',
        saySomething: 'Say something in this realm...',
        send: 'Send',
    },

    vi: {
        // ── Common ─────────────────────────────────────────────────────────────
        save: 'Lưu',
        cancel: 'Hủy',
        ok: 'OK',
        error: 'Lỗi',
        loading: 'Đang tải...',
        back: 'Quay lại',
        signOut: 'Đăng Xuất',
        yes: 'Có',
        no: 'Không',

        // ── Auth ───────────────────────────────────────────────────────────────
        welcomeBack: 'Chào Mừng',
        continueYour: 'Tiếp tục hành trình tu tập.',
        emailAddress: 'Địa Chỉ Email',
        password: 'Mật Khẩu',
        forgotPassword: 'Quên?',
        signIn: 'ĐĂNG NHẬP',
        newToPath: 'Chưa có tài khoản?',
        joinSangha: 'Tham Gia Tăng Đoàn',
        alreadyOnPath: 'Đã có tài khoản?',
        joinSanghaTitle: 'Tham Gia Tăng Đoàn',
        beginPractice: 'Bắt đầu hành trình tu tập hôm nay.',
        createAccount: 'TẠO TÀI KHOẢN',
        checkEmail: 'Kiểm Tra Email',
        emailVerify: 'Chúng tôi đã gửi link xác nhận đến hộp thư của bạn.',
        fillAllFields: 'Vui lòng điền đầy đủ thông tin',
        pwMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',

        // ── Welcome Screen ─────────────────────────────────────────────────────
        welcomeTitle: 'Maratika',
        enterPractice: 'VÀO THIỀN TẬP',
        establishedIn: 'THIẾT LẬP TRONG TRÍ TUỆ',
        tagline: '"Thay Đổi Nhỏ, Kết Quả Phi Thường"',

        // ── Nav Tabs ───────────────────────────────────────────────────────────
        tabHome: 'Trang Chủ',
        tabPractice: 'Tu Tập',
        tabNews: 'Tin tức',
        tabChallenges: 'Thử Thách',
        tabAccount: 'Tài Khoản',

        // ── Dashboard ──────────────────────────────────────────────────────────
        dashboardTitle: 'Tổng Quan',
        todaysPractice: 'Tu Tập Hôm Nay',
        progress: 'Tiến Độ',
        streak: 'Chuỗi Ngày',
        totalCount: 'Tổng Số',
        leaderboard: 'Bảng Xếp Hạng',
        topPractitioners: 'Hành Giả Nổi Bật',

        // ── Practice ───────────────────────────────────────────────────────────
        practiceTitle: 'Tu Tập',
        myPractices: 'Tu Tập Của Tôi',
        allPractices: 'Tất Cả Tu Tập',
        details: 'Chi Tiết',
        chat: 'Trò Chuyện',
        join: 'Tham Gia',
        addToMyPlan: 'Thêm Vào Kế Hoạch',
        rulesOfEngagement: 'Quy Tắc Tu Tập',
        completedBy: 'Đã Hoàn Thành Bởi',
        sangha: 'Tăng Đoàn',
        group: 'Nhóm',
        noMessages: 'Chưa có tin nhắn. Hãy bắt đầu! 🙏',
        createPractice: 'Tạo Tu Tập',
        tabAPLibrary: 'Kho AP',
        participants: 'Người tham gia',

        // ── Challenge ─────────────────────────────────────────────────────────
        challenges: 'Thử Thách',
        createChallenge: 'Tạo Thử Thách',
        launchChallenge: 'KHỞI ĐỘNG THÁCH THỨC',
        saveAsDraft: 'Lưu Nháp',
        difficulty: 'Độ Khó',
        duration: 'Thời Gian (Ngày)',
        goal: 'Mục Tiêu (Tích Lũy)',
        startDate: 'Ngày Bắt Đầu',
        target: 'Mục Tiêu',
        joinChallenge: 'Tham Gia Thử Thách 🙏',
        markAsDone: 'Đánh Dấu Hoàn Thành',
        challengeLaunched: 'Thách Thức Đã Khởi Động!',
        broadcastToSangha: 'Thách thức của bạn đã được gửi đến Tăng Đoàn!',

        // ── Account ───────────────────────────────────────────────────────────
        accountTitle: 'Tài Khoản',
        profile: 'Hồ Sơ',
        displayName: 'Tên Hiển Thị',
        dharmaName: 'Pháp Danh',
        dayStreak: 'Ngày Liên Tiếp',
        totalPractices: 'Tổng Tu Tập',
        notifications: 'Thông Báo',
        privacyData: 'Quyền Riêng Tư & Dữ Liệu',
        language: 'Ngôn Ngữ',
        signOutConfirm: 'Bạn có chắc chắn muốn đăng xuất không?',
        appVersion: 'Maratika Practice v1.0.0 (Alpha)',

        // ── Language ──────────────────────────────────────────────────────────
        selectLanguage: 'Chọn Ngôn Ngữ',
        english: 'English',
        vietnamese: 'Tiếng Việt',
        languageChanged: 'Đã Đổi Ngôn Ngữ',
        languageChangedMsg: 'Ứng dụng đã chuyển sang Tiếng Việt.',

        // ── Micro Learning ───────────────────────────────────────────────────
        learned: 'Đã học',
        notLearned: 'Chưa học',
        locked: 'Đã khóa',
        unlockLesson: 'Mở khóa bài học',
        confirmUnlock: 'Bạn có muốn dùng {0} M-points để mở khóa bài học này không?',
        insufficientPoints: 'Không đủ M-points. Bạn cần thêm {0} điểm.',
        markAsLearned: 'Đánh dấu đã học',
        lessonUnlocked: 'Đã mở khóa bài học!',

        // ── Rebirth Game ─────────────────────────────────────────────────────
        exchanges: 'Trao đổi',
        saySomething: 'Bình luận gì đó...',
        send: 'Gửi',
    },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;
export default translations;
