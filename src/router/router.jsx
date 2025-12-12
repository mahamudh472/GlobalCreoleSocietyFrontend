import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import ProtectedRoute from "../components/ProtectedRoute";
import RootLayout from "../components/RootLayout";

// Landing Page components
import LandingPage from "../Components/LandingPage/LandingPage";
import LandingPageAdsRequest from "../Components/LandingPage/LandingPageAdsRequest";

// Authentication components
import LoginPage from "../Components/Authentication/LoginPage";
import SignUpPage from "../Components/Authentication/SignUpPage";
import Feed from "../Components/Feed/Feed";
import Reels from "../Components/Feed/Reels";
import ShareModal from "../Components/Feed/ShareModal";
import Profile from "../Profile/Profile";
import MarketPlace from "../Components/Marketplace/MarketPlace";

import ProductPage from "../Components/Marketplace/ProductPage";
import SocietyCardGrid from "../Components/Society/SocietyCardGrid";
import JoinSocietyList from "../Components/Society/JoinSocietyList";
import MySocietyList from "../Components/Society/MySocietyList";
import FriendCardGrid from "../Components/FriendRequests/FriendCardGrid";
import FriendRequestList from "../Components/FriendRequests/FriendRequestList";
import AddFriendList from "../Components/FriendRequests/AddFriendList";
import MySociety from "../Components/MySociety/MySociety";
import PendingPosts from "../Components/MySociety/PendingPosts";
import HelpSection from "../Components/Settings/HelpSection";
import ProfileSettings from "../Components/Settings/ProfileSettings";
import ChangePassword from "../Components/Authentication/ChangePassword";
import ChangeEmail from "../Components/Authentication/ChangeEmail";
import ChatApp from "../Messaging/ChatApp";
import VideoCall from "../Messaging/VideoCall";
import AudioCall from "../Messaging/AudioCall";
import LiveStream from "../Components/Feed/LiveStream";
import FriendsList from "../Profile/FriendsList";
import Notifications from "../Components/Notifications";
import OrderCart from "../Components/Marketplace/OrderCart";
import ProductManagement from "../Components/MyProduct/ProductManagement";
import CreateProduct from "../Components/MyProduct/CreateProduct";
import MyProductList from "../Components/MyProduct/MyProductList";
import EditProduct from "../Components/MyProduct/EditProduct";
import ProductCard from "../Components/Marketplace/ProductCard";
import MyProductDetails from "../Components/MyProduct/MyProductDetails";
import Payment from "../Components/Marketplace/Payment";
import PendingMembers from "../Components/MySociety/PendingMembers";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage></LandingPage>,
      },
      {
        path: "/advertisement-request",
        element: <LandingPageAdsRequest></LandingPageAdsRequest>,
      },
      {
        path: "/signin",
        element: <LoginPage></LoginPage>,
      },
      {
        path: "/signup",
        element: <SignUpPage></SignUpPage>,
      },
      // Feed routes..........
      {
        path: "/feed",
        element: (
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        ),
      },
      {
        path: "/feed/livestream",
        element: (
          <ProtectedRoute>
            <LiveStream />
          </ProtectedRoute>
        ),
      },

      {
        path: "/feed/:id",
        element: (
          <ProtectedRoute>
            <Reels />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/:userId",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/friendslist",
        element: (
          <ProtectedRoute>
            <FriendsList />
          </ProtectedRoute>
        ),
      },

      // Markets places routing.................
      {
        path: "/marketplace",
        element: (
          <ProtectedRoute>
            <MarketPlace />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/orderlist",
        element: (
          <ProtectedRoute>
            <OrderCart />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/product/:id",
        element: (
          <ProtectedRoute>
            <ProductCard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/:id/payment",
        element: (
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/myproduct",
        element: (
          <ProtectedRoute>
            <ProductManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/myproduct/list",
        element: (
          <ProtectedRoute>
            <MyProductList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/myproduct/addproduct",
        element: (
          <ProtectedRoute>
            <CreateProduct />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace/myproduct/edit/:id",
        element: (
          <ProtectedRoute>
            <EditProduct />
          </ProtectedRoute>
        ),
      },

      //Society grid.......................
      {
        path: "/society",
        element: (
          <ProtectedRoute>
            <SocietyCardGrid />
          </ProtectedRoute>
        ),
      },
      {
        path: "/society/my_society_list",
        element: (
          <ProtectedRoute>
            <MySocietyList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/society/join_society_list",
        element: (
          <ProtectedRoute>
            <JoinSocietyList />
          </ProtectedRoute>
        ),
      },
      // Friend Request

      {
        path: "/friends",
        element: (
          <ProtectedRoute>
            <FriendCardGrid />
          </ProtectedRoute>
        ),
      },
      {
        path: "/friends/requests",
        element: (
          <ProtectedRoute>
            <FriendRequestList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/friends/suggestions/all",
        element: (
          <ProtectedRoute>
            <AddFriendList />
          </ProtectedRoute>
        ),
      },
      // My society..................................
      {
        path: "/society/:id",
        element: (
          <ProtectedRoute>
            <MySociety />
          </ProtectedRoute>
        ),
      },
      {
        path: "/society/:id/pending_members",
        element: (
          <ProtectedRoute>
            <PendingMembers />
          </ProtectedRoute>
        ),
      },
      {
        path: "/society/:id/pending_posts",
        element: (
          <ProtectedRoute>
            <PendingPosts />
          </ProtectedRoute>
        ),
      },
      // Setting..................................................
      {
        path: "/settings/help_center",
        element: (
          <ProtectedRoute>
            <HelpSection />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profile_settings",
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        ),
      },

      // Authentication............................
      {
        path: "/settings/profile_settings/chnage_password",
        element: (
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profile_settings/chnage_email",
        element: (
          <ProtectedRoute>
            <ChangeEmail />
          </ProtectedRoute>
        ),
      },
      // Chat app, messesing......................................
      {
        path: "/chat",
        element: (
          <ProtectedRoute>
            <ChatApp />
          </ProtectedRoute>
        ),
      },
      {
        path: "/chat/videocall",
        element: (
          <ProtectedRoute>
            <VideoCall />
          </ProtectedRoute>
        ),
      },
      {
        path: "/chat/audiocall",
        element: (
          <ProtectedRoute>
            <AudioCall />
          </ProtectedRoute>
        ),
      },
      // Notification..............................
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
