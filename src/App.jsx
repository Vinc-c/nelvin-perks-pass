import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/i18n/I18nContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
const Register = lazy(() => import('@/pages/Register'));
const Join = lazy(() => import('@/pages/Join'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
import Landing from '@/pages/Landing';
const Pricing = lazy(() => import('@/pages/Pricing'));
const EmployeePortal = lazy(() => import('@/pages/EmployeePortal'));
const MemberPortal = lazy(() => import('@/pages/MemberPortal'));
const HRPortal = lazy(() => import('@/pages/HRPortal'));
const MerchantPortal = lazy(() => import('@/pages/MerchantPortal'));
const BecomePartner = lazy(() => import('@/pages/BecomePartner'));
const AdminPortal = lazy(() => import('@/pages/AdminPortal'));
const OfferDetails = lazy(() => import('@/pages/OfferDetails'));
const WalletActivity = lazy(() => import('@/pages/WalletActivity'));
const CampaignEditor = lazy(() => import('@/pages/CampaignEditor'));
const KycVerification = lazy(() => import('@/pages/KycVerification'));
const HrSavingsReport = lazy(() => import('@/pages/HrSavingsReport'));
const SupportCenter = lazy(() => import('@/pages/SupportCenter'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const MerchantMap = lazy(() => import('@/pages/MerchantMap'));
const Settings = lazy(() => import('@/pages/Settings'));
const RewardHistory = lazy(() => import('@/pages/RewardHistory'));
const CurrencyExchange = lazy(() => import('@/pages/CurrencyExchange'));
const MerchantDirectory = lazy(() => import('@/pages/MerchantDirectory'));
const AnalyticsOverview = lazy(() => import('@/pages/AnalyticsOverview'));
const NotificationSettings = lazy(() => import('@/pages/NotificationSettings'));
const MembershipTiers = lazy(() => import('@/pages/MembershipTiers'));
const ReferralProgram = lazy(() => import('@/pages/ReferralProgram'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const MyRewards = lazy(() => import('@/pages/MyRewards'));
const SubscriptionManagement = lazy(() => import('@/pages/SubscriptionManagement'));
const SecuritySettings = lazy(() => import('@/pages/SecuritySettings'));
const RecognitionWall = lazy(() => import('@/pages/RecognitionWall'));
const SupportTickets = lazy(() => import('@/pages/SupportTickets'));
const MonthlyReports = lazy(() => import('@/pages/MonthlyReports'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const RoleHome = lazy(() => import('@/pages/RoleHome'));
import RoleRoute from '@/components/RoleRoute';
import AccessGateLayout from '@/components/AccessGateLayout';
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'));
const PaymentReturn = lazy(() => import('@/pages/PaymentReturn'));
const PullRequests = lazy(() => import('@/pages/PullRequests'));

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, authChecked } = useAuth();

  // Show a spinner only while the very first session check runs.
  if (isLoadingAuth && !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<Join />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/merchant" element={<BecomePartner />} />
      <Route path="/merchant-directory" element={<MerchantDirectory />} />
      <Route path="/merchant-map" element={<MerchantMap />} />
      <Route path="/offer-details" element={<OfferDetails />} />
      <Route path="/help-center" element={<HelpCenter />} />

      {/* Legal */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/payment-return" element={<PaymentReturn />} />

      <Route element={<ProtectedRoute />}>
        {/* Entry points */}
        <Route path="/app" element={<RoleHome />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Particulier */}
        <Route element={<RoleRoute allow={["MEMBER", "user"]} />}>
          <Route path="/member" element={<MemberPortal />} />
        </Route>

        {/* Employé */}
        <Route element={<RoleRoute allow={["EMPLOYEE"]} />}>
          <Route path="/employee" element={<EmployeePortal />} />
        </Route>

        {/* Entreprise (employés + RH) */}
        <Route element={<RoleRoute allow={["EMPLOYEE", "HR_ADMIN"]} />}>
          <Route path="/recognition-wall" element={<RecognitionWall />} />
        </Route>

        {/* RH */}
        <Route element={<RoleRoute allow={["HR_ADMIN"]} />}>
          <Route path="/hr" element={<HRPortal />} />
          <Route path="/hr-savings-report" element={<HrSavingsReport />} />
          <Route path="/monthly-reports" element={<MonthlyReports />} />
        </Route>

        {/* Marchand */}
        <Route element={<RoleRoute allow={["MERCHANT"]} />}>
          <Route path="/merchant-dashboard" element={<MerchantPortal />} />
          <Route path="/campaign-editor" element={<CampaignEditor />} />
          <Route path="/kyc-verification" element={<KycVerification />} />
        </Route>

        {/* Super admin only */}
        <Route element={<RoleRoute allow={[]} />}>
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/pull-requests" element={<PullRequests />} />
        </Route>

        {/* Shared — any onboarded account. Billing, membership & account
            settings stay reachable even when access is denied, so the user
            can renew. Transactional pages are gated by an active subscription. */}
        <Route element={<RoleRoute />}>
          <Route path="/support-center" element={<SupportCenter />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<AnalyticsOverview />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/membership-plans" element={<MembershipTiers />} />
          <Route path="/referral-program" element={<ReferralProgram />} />
          <Route path="/billing-settings" element={<SubscriptionManagement />} />
          <Route path="/security-settings" element={<SecuritySettings />} />
          <Route path="/support-tickets" element={<SupportTickets />} />

          <Route element={<AccessGateLayout />}>
            <Route path="/wallet-activity" element={<WalletActivity />} />
            <Route path="/reward-history" element={<RewardHistory />} />
            <Route path="/currency-exchange" element={<CurrencyExchange />} />
            <Route path="/my-rewards" element={<MyRewards />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App