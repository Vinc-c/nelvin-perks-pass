import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { I18nProvider } from '@/i18n/I18nContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Join from '@/pages/Join';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Landing from '@/pages/Landing';
import Pricing from '@/pages/Pricing';
import EmployeePortal from '@/pages/EmployeePortal';
import MemberPortal from '@/pages/MemberPortal';
import HRPortal from '@/pages/HRPortal';
import MerchantPortal from '@/pages/MerchantPortal';
import BecomePartner from '@/pages/BecomePartner';
import AdminPortal from '@/pages/AdminPortal';
import OfferDetails from '@/pages/OfferDetails';
import WalletActivity from '@/pages/WalletActivity';
import CampaignEditor from '@/pages/CampaignEditor';
import KycVerification from '@/pages/KycVerification';
import HrSavingsReport from '@/pages/HrSavingsReport';
import SupportCenter from '@/pages/SupportCenter';
import Notifications from '@/pages/Notifications';
import MerchantMap from '@/pages/MerchantMap';
import Settings from '@/pages/Settings';
import RewardHistory from '@/pages/RewardHistory';
import CurrencyExchange from '@/pages/CurrencyExchange';
import MerchantDirectory from '@/pages/MerchantDirectory';
import AnalyticsOverview from '@/pages/AnalyticsOverview';
import NotificationSettings from '@/pages/NotificationSettings';
import MembershipTiers from '@/pages/MembershipTiers';
import ReferralProgram from '@/pages/ReferralProgram';
import HelpCenter from '@/pages/HelpCenter';
import MyRewards from '@/pages/MyRewards';
import SubscriptionManagement from '@/pages/SubscriptionManagement';
import SecuritySettings from '@/pages/SecuritySettings';
import RecognitionWall from '@/pages/RecognitionWall';
import SupportTickets from '@/pages/SupportTickets';
import MonthlyReports from '@/pages/MonthlyReports';
import Onboarding from '@/pages/Onboarding';
import RoleHome from '@/pages/RoleHome';
import RoleRoute from '@/components/RoleRoute';
import AccessGateLayout from '@/components/AccessGateLayout';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import CookiePolicy from '@/pages/CookiePolicy';
import RefundPolicy from '@/pages/RefundPolicy';
import PaymentReturn from '@/pages/PaymentReturn';
import PullRequests from '@/pages/PullRequests';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
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
      <Route path="/help-center" element={<HelpCenter />} />

      {/* Legal */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/payment-return" element={<PaymentReturn />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
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
            <Route path="/offer-details" element={<OfferDetails />} />
            <Route path="/wallet-activity" element={<WalletActivity />} />
            <Route path="/reward-history" element={<RewardHistory />} />
            <Route path="/currency-exchange" element={<CurrencyExchange />} />
            <Route path="/my-rewards" element={<MyRewards />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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