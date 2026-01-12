import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BASEEND_URL;

// Axios base config
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  /* =======================
     CHECK AUTH (SAFE)
  ======================= */
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      // ❗ DO NOTHING ON 401
      // 401 just means user is not logged in
      console.log("Auth check failed");
    }
  };

  /* =======================
     LOGIN
  ======================= */
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (!data.success) {
        return toast.error(data.message);
      }

      // Save token
      localStorage.setItem("token", data.token);
      axios.defaults.headers.common["token"] = data.token;
      setToken(data.token);

      // Save user
      setAuthUser(data.userData);
      connectSocket(data.userData);

      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  /* =======================
     LOGOUT
  ======================= */
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["token"];

    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    toast.success("Logged out successfully");
  };

  /* =======================
     UPDATE PROFILE
  ======================= */
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {
        setAuthUser(data.updatedUser);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  /* =======================
     SOCKET CONNECTION
  ======================= */
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
  };

  /* =======================
     INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
