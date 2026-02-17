import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import WorldMap from "./components/WorldMap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_STORAGE_KEY = "we-all-with-you-admin-auth";
const STRIPE_MONTHLY_LINK =
  import.meta.env.VITE_STRIPE_MONTHLY_LINK || "https://checkout.stripe.com/pay/we-all-with-you-monthly";
const STRIPE_ONCE_LINK =
  import.meta.env.VITE_STRIPE_ONCE_LINK || "https://checkout.stripe.com/pay/we-all-with-you-one-time";

const donationQuotes = [
  "Your support is a lifeline for families in crisis.",
  "Small help today creates a stronger tomorrow."
];

const sponsorCompanies = [
  {
    name: "UNICEF",
    abbr: "UN",
    color: "#00AEEF"
  },
  {
    name: "World Bank",
    abbr: "WB",
    color: "#0072BC"
  },
  {
    name: "Google.org",
    abbr: "GO",
    color: "#4285F4"
  },
  {
    name: "Microsoft",
    abbr: "MS",
    color: "#F25022"
  },
  {
    name: "UNHCR",
    abbr: "UH",
    color: "#0072CE"
  },
  {
    name: "WHO",
    abbr: "WH",
    color: "#0093D0"
  }
];

const FALLBACK_PROGRAM_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85";
const ABOUT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80";

const defaultPrograms = [
  {
    _id: "default-food",
    title: "Emergency Food Support",
    category: "food",
    shortQuote: "No child should sleep hungry.",
    description:
      "We provide emergency ration kits and nutrition services in crisis regions so families can survive and recover.",
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80",
    receivedAmount: 482000
  },
  {
    _id: "default-education",
    title: "Education Support",
    category: "education",
    shortQuote: "Education gives children power to rebuild their future.",
    description:
      "We help children continue learning with school supplies, safe learning spaces, and teacher support in affected communities.",
    imageUrl:
      "https://images.unsplash.com/photo-1469571486292-b53601010376?auto=format&fit=crop&w=1000&q=80",
    receivedAmount: 317500
  },
  {
    _id: "default-refugees",
    title: "Refugee Protection",
    category: "refugees",
    shortQuote: "Every displaced family deserves safety, food and dignity.",
    description:
      "We support refugees with food assistance, shelter essentials, and emergency healthcare referrals.",
    imageUrl:
      "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=1000&q=80",
    receivedAmount: 563000
  },
  {
    _id: "default-kindness",
    title: "Kindness in Action",
    category: "community",
    shortQuote: "Kindness multiplied can transform an entire community.",
    description:
      "Local volunteers and donors drive long-term resilience through nutrition, livelihood and social support programs.",
    imageUrl:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=80",
    receivedAmount: 228400
  }
];

export default function App() {
  const [stats, setStats] = useState({ sufferingCount: 309000000, benefitedCount: 12400000 });
  const [animated, setAnimated] = useState({ suffering: 0, benefited: 0 });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [programMessage, setProgramMessage] = useState("");
  const [adminAuthMessage, setAdminAuthMessage] = useState("");

  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(defaultPrograms[0]);
  const [supportSlide, setSupportSlide] = useState(0);

  const [form, setForm] = useState({
    name: "",
    country: "",
    email: "",
    phone: "",
    amount: 25,
    donationType: "monthly",
    selectedQuote: donationQuotes[0],
    paymentMethod: "qr"
  });

  const [adminForm, setAdminForm] = useState({
    title: "",
    category: "education",
    description: "",
    imageUrl: "",
    imageData: "",
    receivedAmount: ""
  });
  const [adminAuthMode, setAdminAuthMode] = useState("login");
  const [adminAuth, setAdminAuth] = useState({ token: "", admin: null });
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [amountDrafts, setAmountDrafts] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adminDashboardTab, setAdminDashboardTab] = useState("create");
  const [programListPage, setProgramListPage] = useState(1);
  const [financeOverview, setFinanceOverview] = useState({
    totalReceived: 0,
    totalWithdrawn: 0,
    balance: 0,
    donationCount: 0,
    withdrawalCount: 0,
    pendingRequestCount: 0,
    pendingRequestedAmount: 0,
    lastWithdrawal: null
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsMeta, setWithdrawalsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [financeDonations, setFinanceDonations] = useState([]);
  const [financeDonationsMeta, setFinanceDonationsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [donationRecords, setDonationRecords] = useState([]);
  const [donationRecordsMeta, setDonationRecordsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [donationRecordsPage, setDonationRecordsPage] = useState(1);
  const [donationFilters, setDonationFilters] = useState({
    country: "",
    paymentMethod: "",
    dateFrom: "",
    dateTo: ""
  });
  const [managementLogs, setManagementLogs] = useState([]);
  const [managementLogsMeta, setManagementLogsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [managementLogsPage, setManagementLogsPage] = useState(1);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [withdrawRequestsMeta, setWithdrawRequestsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [withdrawRequestsPage, setWithdrawRequestsPage] = useState(1);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserFilters, setAdminUserFilters] = useState({
    query: ""
  });
  const [adminManagementMessage, setAdminManagementMessage] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", note: "" });
  const [financeMessage, setFinanceMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const allPrograms = useMemo(() => [...defaultPrograms, ...programs], [programs]);
  const supportSliderCards = useMemo(() => {
    if (allPrograms.length === 0) return [];
    if (allPrograms.length >= 3) {
      return [
        allPrograms[supportSlide % allPrograms.length],
        allPrograms[(supportSlide + 1) % allPrograms.length],
        allPrograms[(supportSlide + 2) % allPrograms.length]
      ];
    }
    if (allPrograms.length === 2) {
      return [allPrograms[supportSlide % 2], allPrograms[(supportSlide + 1) % 2], allPrograms[supportSlide % 2]];
    }
    return [allPrograms[0], allPrograms[0], allPrograms[0]];
  }, [allPrograms, supportSlide]);
  const filteredAdminUsers = useMemo(() => {
    const query = adminUserFilters.query.trim().toLowerCase();
    return adminUsers.filter((adminItem) => {
      const matchesQuery = query
        ? adminItem.name.toLowerCase().includes(query) || adminItem.email.toLowerCase().includes(query)
        : true;
      return matchesQuery;
    });
  }, [adminUsers, adminUserFilters]);
  const isApprover = true;
  const pagedPrograms = useMemo(() => {
    const perPage = 6;
    const start = (programListPage - 1) * perPage;
    return allPrograms.slice(start, start + perPage);
  }, [allPrograms, programListPage]);
  const programTotalPages = Math.max(Math.ceil(allPrograms.length / 6), 1);

  useEffect(() => {
    if (supportSlide > allPrograms.length - 1) {
      setSupportSlide(0);
    }
  }, [allPrograms.length, supportSlide]);

  useEffect(() => {
    if (allPrograms.length <= 1) return;
    const timer = setInterval(() => {
      setSupportSlide((prev) => (prev + 1) % allPrograms.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allPrograms.length]);

  useEffect(() => {
    setAmountDrafts((prev) => {
      const next = { ...prev };
      allPrograms.forEach((program) => {
        if (next[program._id] === undefined) {
          next[program._id] = String(Number(program.receivedAmount || 0));
        }
      });
      return next;
    });
  }, [allPrograms]);

  useEffect(() => {
    const hydrateAdminSession = async () => {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        if (!parsed?.token) {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
          return;
        }

        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` }
        });

        setAdminAuth({ token: parsed.token, admin: response.data.admin });
      } catch (_error) {
        setAdminAuth({ token: "", admin: null });
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        setAdminAuthMessage("Session expired, please login again.");
      }
    };

    hydrateAdminSession();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Stats fetch failed", error);
      }
    };

    const fetchPrograms = async () => {
      try {
        let page = 1;
        let totalPages = 1;
        const allItems = [];

        while (page <= totalPages) {
          const response = await axios.get(`${API_URL}/programs`, {
            params: { page, pageSize: 100 }
          });
          const payload = response.data;
          const items = Array.isArray(payload) ? payload : payload.items || [];
          allItems.push(...items);
          totalPages = Array.isArray(payload) ? 1 : payload.totalPages || 1;
          page += 1;
        }

        setPrograms(allItems);
      } catch (error) {
        console.error("Programs fetch failed", error);
      }
    };

    fetchStats();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!adminAuth.token) return;

    const fetchFinance = async () => {
      try {
        const [overviewRes, withdrawalsRes, requestsRes, donationsRes] = await Promise.all([
          axios.get(`${API_URL}/finance/overview`, {
            headers: { Authorization: `Bearer ${adminAuth.token}` }
          }),
          axios.get(`${API_URL}/finance/withdrawals`, {
            params: { page: withdrawalsPage, pageSize: 8 },
            headers: { Authorization: `Bearer ${adminAuth.token}` }
          }),
          axios.get(`${API_URL}/finance/withdraw-requests`, {
            params: { page: withdrawRequestsPage, pageSize: 8, status: "pending" },
            headers: { Authorization: `Bearer ${adminAuth.token}` }
          }),
          axios.get(`${API_URL}/finance/donations`, {
            params: { page: 1, pageSize: 5 },
            headers: { Authorization: `Bearer ${adminAuth.token}` }
          })
        ]);
        setFinanceOverview(overviewRes.data);
        setWithdrawals(withdrawalsRes.data.items || []);
        setWithdrawalsMeta({
          page: withdrawalsRes.data.page || 1,
          totalPages: withdrawalsRes.data.totalPages || 1,
          total: withdrawalsRes.data.total || 0
        });
        setWithdrawRequests(requestsRes.data.items || []);
        setWithdrawRequestsMeta({
          page: requestsRes.data.page || 1,
          totalPages: requestsRes.data.totalPages || 1,
          total: requestsRes.data.total || 0
        });
        setFinanceDonations(donationsRes.data.items || []);
        setFinanceDonationsMeta({
          page: donationsRes.data.page || 1,
          totalPages: donationsRes.data.totalPages || 1,
          total: donationsRes.data.total || 0
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          expireAdminSession();
        }
      }
    };

    fetchFinance();
  }, [adminAuth.token, withdrawRequestsPage, withdrawalsPage]);

  useEffect(() => {
    if (!adminAuth.token || !isApprover || adminDashboardTab !== "donations") return;

    const fetchPage = async () => {
      try {
        await fetchDonationRecords();
      } catch (_error) {
        // handled in fetchDonationRecords callers
      }
    };

    fetchPage();
  }, [adminAuth.token, adminDashboardTab, donationRecordsPage, isApprover]);

  useEffect(() => {
    if (!adminAuth.token || !isApprover || adminDashboardTab !== "logs") return;

    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_URL}/finance/management-logs`, {
          params: { page: managementLogsPage, pageSize: 12 },
          headers: { Authorization: `Bearer ${adminAuth.token}` }
        });
        setManagementLogs(response.data.items || []);
        setManagementLogsMeta({
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || 0
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          expireAdminSession();
          setFinanceMessage("Admin session expired. Please login and try again.");
        } else {
          setFinanceMessage(error?.response?.data?.message || "Could not load management logs.");
        }
      }
    };

    fetchLogs();
  }, [adminAuth.token, adminDashboardTab, isApprover, managementLogsPage]);

  useEffect(() => {
    if (!adminAuth.token || adminDashboardTab !== "admins" || !isApprover) return;

    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/admins`, {
          headers: { Authorization: `Bearer ${adminAuth.token}` }
        });
        setAdminUsers(response.data);
      } catch (error) {
        if (error?.response?.status === 401) {
          expireAdminSession();
        } else {
          setAdminManagementMessage(error?.response?.data?.message || "Could not load admin users.");
        }
      }
    };

    fetchAdmins();
  }, [adminAuth.token, adminDashboardTab, isApprover]);

  useEffect(() => {
    let frame;
    const duration = 1500;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimated({
        suffering: Math.floor(stats.sufferingCount * progress),
        benefited: Math.floor(stats.benefitedCount * progress)
      });

      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [stats]);

  const benefitInMillions = useMemo(() => (animated.benefited / 1000000).toFixed(1), [animated.benefited]);

  useEffect(() => {
    if (!popupMessage) return;
    const timer = setTimeout(() => setPopupMessage(""), 2600);
    return () => clearTimeout(timer);
  }, [popupMessage]);

  const notify = (text) => {
    if (text) setPopupMessage(text);
  };

  const handleGlobalClickToast = (event) => {
    const clickable = event.target.closest("button, a");
    if (!clickable) return;

    const text = clickable.getAttribute("data-toast") || clickable.textContent?.trim();
    if (!text) return;
    notify(`${text} clicked`);
  };

  const upiPayload = useMemo(() => {
    const amount = Number(form.amount || 0) || (form.donationType === "monthly" ? 25 : 60);
    const note = encodeURIComponent(form.selectedQuote);
    return `upi://pay?pa=weallwithyou@upi&pn=We%20All%20With%20You&am=${amount}&cu=INR&tn=${note}`;
  }, [form.amount, form.donationType, form.selectedQuote]);

  const stripePayload = useMemo(() => {
    return form.donationType === "monthly" ? STRIPE_MONTHLY_LINK : STRIPE_ONCE_LINK;
  }, [form.donationType]);

  const qrPayload = form.paymentMethod === "qr" ? upiPayload : stripePayload;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "donationType") {
        updated.amount = value === "monthly" ? 25 : 60;
      }
      return updated;
    });
  };

  const handleAdminChange = (event) => {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountDraftChange = (programId, value) => {
    setAmountDrafts((prev) => ({ ...prev, [programId]: value }));
  };

  const handleWithdrawChange = (event) => {
    const { name, value } = event.target;
    setWithdrawForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminUserFilterChange = (event) => {
    const { name, value } = event.target;
    setAdminUserFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDonationFilterChange = (event) => {
    const { name, value } = event.target;
    setDonationFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAdminForm((prev) => ({ ...prev, imageData: String(reader.result), imageUrl: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_URL}/donations`, form);
      if (adminAuth.token) {
        await refreshFinanceData();
      }
      const doneMsg = "Thank you for supporting We All With You.";
      setMessage(doneMsg);
      notify(doneMsg);
      setForm({
        name: "",
        country: "",
        email: "",
        phone: "",
        amount: 25,
        donationType: "monthly",
        selectedQuote: donationQuotes[0],
        paymentMethod: "qr"
      });
    } catch (error) {
      const errorMsg = "Could not save your donation details right now.";
      setMessage(errorMsg);
      notify(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegisterOrLogin = async (event) => {
    event.preventDefault();
    setAdminAuthMessage("");

    const endpoint = adminAuthMode === "register" ? "register" : "login";
    const payload =
      adminAuthMode === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };

    try {
      const response = await axios.post(`${API_URL}/auth/${endpoint}`, payload);
      if (adminAuthMode === "register") {
        const registerMsg = response?.data?.message || "Admin registered successfully. Please login.";
        setAdminAuthMessage(registerMsg);
        notify(registerMsg);
        setAdminAuthMode("login");
      } else {
        const authData = response.data;
        setAdminAuth(authData);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(authData));
        const loginMsg = "Admin login successful.";
        setAdminAuthMessage(loginMsg);
        notify(loginMsg);
      }
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      const statusCode = error?.response?.status;
      const networkMessage = error?.message;
      const authError =
        serverMessage ||
        (statusCode ? `Admin authentication failed (HTTP ${statusCode}).` : `Network error: ${networkMessage}`);
      setAdminAuthMessage(authError);
      notify(authError);
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth({ token: "", admin: null });
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    const outMsg = "Logged out.";
    setAdminAuthMessage(outMsg);
  };

  const expireAdminSession = () => {
    setAdminAuth({ token: "", admin: null });
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    const expiredMsg = "Session expired, please login again.";
    setAdminAuthMessage(expiredMsg);
  };

  const handleProgramCreate = async (event) => {
    event.preventDefault();
    setProgramMessage("");

    try {
      if (!adminAuth.token) {
        setProgramMessage("Please login as admin first.");
        return;
      }
      const payload = {
        title: adminForm.title,
        category: adminForm.category,
        description: adminForm.description,
        imageUrl: adminForm.imageUrl,
        imageData: adminForm.imageData,
        receivedAmount: Number(adminForm.receivedAmount || 0)
      };

      const response = await axios.post(`${API_URL}/programs`, payload, {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      });
      const newProgram = response.data;
      setPrograms((prev) => [newProgram, ...prev]);
      setSelectedProgram(newProgram);
      const okMsg = "Program dashboard created.";
      setProgramMessage(okMsg);
      setAdminForm({
        title: "",
        category: "education",
        description: "",
        imageUrl: "",
        imageData: "",
        receivedAmount: ""
      });
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        expireAdminSession();
        const noAuthMsg = "Admin access changed. Please login again and try.";
        setProgramMessage(noAuthMsg);
      } else {
        const serverMessage = error?.response?.data?.message;
        const detail = error?.response?.data?.error;
        const createErr = serverMessage ? `${serverMessage}${detail ? `: ${detail}` : ""}` : "Could not create program right now.";
        setProgramMessage(createErr);
      }
    }
  };

  const handleAmountUpdate = async (program) => {
    if (!adminAuth.token) {
      setProgramMessage("Please login as admin first.");
      return;
    }
    if (!isApprover) {
      setProgramMessage("Approver role required for amount updates.");
      return;
    }

    if (String(program._id).startsWith("default-")) {
      setProgramMessage("Default profile amount is fixed. Create custom profiles to edit amount.");
      return;
    }

    try {
      const amount = Number(amountDrafts[program._id] || 0);
      const response = await axios.patch(
        `${API_URL}/programs/${program._id}/amount`,
        { amount },
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );

      const updated = response.data;
      setPrograms((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      if (selectedProgram?._id === updated._id) setSelectedProgram(updated);
      const updateMsg = `Updated amount for ${updated.title}.`;
      setProgramMessage(updateMsg);
    } catch (error) {
      if (error?.response?.status === 401) {
        expireAdminSession();
        setProgramMessage("Admin session expired. Please login and try again.");
      } else {
        const amountErr = "Could not update profile amount right now.";
        setProgramMessage(amountErr);
      }
    }
  };

  const handleDeleteProfile = async (program) => {
    if (!adminAuth.token) {
      setProgramMessage("Please login as admin first.");
      return;
    }
    if (!isApprover) {
      setProgramMessage("Approver role required for profile deletion.");
      return;
    }

    if (String(program._id).startsWith("default-")) {
      setProgramMessage("Default profile cannot be deleted.");
      return;
    }

    try {
      await axios.delete(`${API_URL}/programs/${program._id}`, {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      });

      setPrograms((prev) => prev.filter((item) => item._id !== program._id));
      setAmountDrafts((prev) => {
        const next = { ...prev };
        delete next[program._id];
        return next;
      });

      if (selectedProgram?._id === program._id) {
        setSelectedProgram(defaultPrograms[0]);
      }

      const deleteMsg = `Deleted profile: ${program.title}`;
      setProgramMessage(deleteMsg);
    } catch (error) {
      if (error?.response?.status === 401) {
        expireAdminSession();
        setProgramMessage("Admin session expired. Please login and try again.");
      } else {
        const deleteErr = "Could not delete profile right now.";
        setProgramMessage(deleteErr);
      }
    }
  };

  const refreshFinanceData = async () => {
    if (!adminAuth.token) return;
    const [overviewRes, withdrawalsRes, requestsRes, donationsRes] = await Promise.all([
      axios.get(`${API_URL}/finance/overview`, {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }),
      axios.get(`${API_URL}/finance/withdrawals`, {
        params: { page: withdrawalsPage, pageSize: 8 },
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }),
      axios.get(`${API_URL}/finance/withdraw-requests`, {
        params: { page: withdrawRequestsPage, pageSize: 8, status: "pending" },
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }),
      axios.get(`${API_URL}/finance/donations`, {
        params: { page: 1, pageSize: 5 },
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      })
    ]);

    setFinanceOverview(overviewRes.data);
    setWithdrawals(withdrawalsRes.data.items || []);
    setWithdrawalsMeta({
      page: withdrawalsRes.data.page || 1,
      totalPages: withdrawalsRes.data.totalPages || 1,
      total: withdrawalsRes.data.total || 0
    });
    setWithdrawRequests(requestsRes.data.items || []);
    setWithdrawRequestsMeta({
      page: requestsRes.data.page || 1,
      totalPages: requestsRes.data.totalPages || 1,
      total: requestsRes.data.total || 0
    });
    setFinanceDonations(donationsRes.data.items || []);
    setFinanceDonationsMeta({
      page: donationsRes.data.page || 1,
      totalPages: donationsRes.data.totalPages || 1,
      total: donationsRes.data.total || 0
    });
  };

  const fetchDonationRecords = async () => {
    if (!adminAuth.token) return;
    const params = {};
    if (donationFilters.country) params.country = donationFilters.country;
    if (donationFilters.paymentMethod) params.paymentMethod = donationFilters.paymentMethod;
    if (donationFilters.dateFrom) params.dateFrom = donationFilters.dateFrom;
    if (donationFilters.dateTo) params.dateTo = donationFilters.dateTo;
    params.page = donationRecordsPage;
    params.pageSize = 10;

    const response = await axios.get(`${API_URL}/finance/donations`, {
      params,
      headers: { Authorization: `Bearer ${adminAuth.token}` }
    });
    setDonationRecords(response.data.items || []);
    setDonationRecordsMeta({
      page: response.data.page || 1,
      totalPages: response.data.totalPages || 1,
      total: response.data.total || 0
    });
  };

  const handleDonationRecordFilterSubmit = async (event) => {
    event.preventDefault();
    setFinanceMessage("");
    if (donationRecordsPage !== 1) {
      setDonationRecordsPage(1);
      return;
    }
    try {
      await fetchDonationRecords();
      const filterMsg = "Donation records filtered.";
      setFinanceMessage(filterMsg);
    } catch (error) {
      if (error?.response?.status === 401) {
        expireAdminSession();
        setFinanceMessage("Admin session expired. Please login and try again.");
      } else {
        const filterErr = error?.response?.data?.message || "Could not load donation records.";
        setFinanceMessage(filterErr);
      }
    }
  };

  const clearDonationFilters = async () => {
    setDonationFilters({ country: "", paymentMethod: "", dateFrom: "", dateTo: "" });
    setDonationRecordsPage(1);
    if (!adminAuth.token) return;
    try {
      const response = await axios.get(`${API_URL}/finance/donations`, {
        params: { page: 1, pageSize: 10 },
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      });
      setDonationRecords(response.data.items || []);
      setDonationRecordsMeta({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0
      });
    } catch (_error) {
      // ignore; session handling is already covered in other flows
    }
  };

  const handleExportDonationsCsv = async () => {
    if (!adminAuth.token) return;

    const params = {};
    if (donationFilters.country) params.country = donationFilters.country;
    if (donationFilters.paymentMethod) params.paymentMethod = donationFilters.paymentMethod;
    if (donationFilters.dateFrom) params.dateFrom = donationFilters.dateFrom;
    if (donationFilters.dateTo) params.dateTo = donationFilters.dateTo;

    try {
      const response = await axios.get(`${API_URL}/finance/donations/export.csv`, {
        params,
        headers: { Authorization: `Bearer ${adminAuth.token}` },
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "donation-records.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const csvErr = error?.response?.data?.message || "CSV export failed.";
      setFinanceMessage(csvErr);
    }
  };

  const handleWithdrawRequest = async (event) => {
    event.preventDefault();
    setFinanceMessage("");

    if (!adminAuth.token) {
      setFinanceMessage("Please login as admin first.");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/finance/withdraw-request`,
        {
          amount: Number(withdrawForm.amount || 0),
          note: withdrawForm.note
        },
        {
          headers: { Authorization: `Bearer ${adminAuth.token}` }
        }
      );

      await refreshFinanceData();
      setWithdrawForm({ amount: "", note: "" });
      const withdrawMsg = "Withdrawal request created and waiting for approval.";
      setFinanceMessage(withdrawMsg);
    } catch (error) {
      if (error?.response?.status === 401) {
        expireAdminSession();
        setFinanceMessage("Admin session expired. Please login and try again.");
      } else {
        const withdrawErr = error?.response?.data?.message || "Could not process withdrawal.";
        setFinanceMessage(withdrawErr);
      }
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    setFinanceMessage("");
    if (!adminAuth.token) {
      setFinanceMessage("Please login as admin first.");
      return;
    }
    try {
      await axios.patch(
        `${API_URL}/finance/withdraw-requests/${requestId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${adminAuth.token}` } }
      );
      await refreshFinanceData();
      const reviewMsg = action === "approve" ? "Withdrawal request approved." : "Withdrawal request rejected.";
      setFinanceMessage(reviewMsg);
    } catch (error) {
      if (error?.response?.status === 401) {
        expireAdminSession();
        setFinanceMessage("Admin session expired. Please login and try again.");
      } else {
        const reviewErr = error?.response?.data?.message || "Could not review request.";
        setFinanceMessage(reviewErr);
      }
    }
  };

  const openDeleteModal = (program) => {
    setDeleteTarget(program);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  return (
    <div onClickCapture={handleGlobalClickToast}>
      <header className="hero" id="home">
        <nav className="nav">
          <h1 className="brand-lockup">
            <span className="brand-logo" aria-hidden="true">
              <span className="brand-bird">🕊️</span>
              <span className="brand-globe">🌍</span>
            </span>
            <span className="brand-text">
              <strong>We All With You</strong>
              <small>Free Bird World</small>
            </span>
          </h1>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#support">Support Us</a>
            <a href="#donate">Donate</a>
            <a href="#admin">Admin</a>
          </div>
        </nav>
        <div className="hero-content">
          <h2>Together, we can feed hope and protect dignity.</h2>
          <p className="hero-paragraph">
            We are here to serve families affected by hunger, conflict, and disaster with life-saving food,
            education support, refugee protection and long-term recovery so every person can live with dignity.
          </p>
          <a href="#donate" className="donate-btn">
            Donate Now
          </a>
        </div>
      </header>

      <section className="stats">
        <div>
          <h3>{(animated.suffering / 1000000).toFixed(0)}M+</h3>
          <p>People suffering from hunger and crisis worldwide</p>
        </div>
        <div>
          <h3>{benefitInMillions}M+</h3>
          <p>People benefited through our programs</p>
        </div>
      </section>

      <section id="support" className="support">
        <h2>Support Us</h2>
        <p>Your kindness creates food security, education access, refugee protection, and long-term recovery.</p>
        <div className="support-slider">
          <button
            type="button"
            className="slide-nav"
            onClick={() => setSupportSlide((prev) => (prev - 1 + allPrograms.length) % allPrograms.length)}
          >
            {"<"}
          </button>
          <div className="slide-track">
            {supportSliderCards.map((program, idx) => (
              <article key={`${program._id}-${idx}`} className="slide-card">
                <img
                  src={program.imageData || program.imageUrl || FALLBACK_PROGRAM_IMAGE}
                  alt={program.title}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_PROGRAM_IMAGE;
                  }}
                />
                <h3>{program.title}</h3>
                <p>{program.shortQuote || program.description}</p>
                <button type="button" className="view-btn" onClick={() => setSelectedProgram(program)}>
                  View More
                </button>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="slide-nav"
            onClick={() => setSupportSlide((prev) => (prev + 1) % allPrograms.length)}
          >
            {">"}
          </button>
        </div>
        <div className="slide-dots">
          {allPrograms.map((program, index) => (
            <button
              key={program._id}
              type="button"
              className={index === supportSlide ? "dot active" : "dot"}
              onClick={() => setSupportSlide(index)}
              aria-label={`Go to ${program.title}`}
            />
          ))}
        </div>

        {selectedProgram && (
          <div className="support-dashboard">
            <img
              src={selectedProgram.imageData || selectedProgram.imageUrl || FALLBACK_PROGRAM_IMAGE}
              alt={selectedProgram.title}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_PROGRAM_IMAGE;
              }}
            />
            <div>
              <h3>{selectedProgram.title} Dashboard</h3>
              <p className="program-category">Category: {selectedProgram.category}</p>
              <p>{selectedProgram.description}</p>
              <p className="program-amount">
                Received Amount: <strong>${Number(selectedProgram.receivedAmount || 0).toLocaleString()}</strong>
              </p>
              <a href="#donate" className="donate-btn">
                Support This Program
              </a>
            </div>
          </div>
        )}
      </section>

      <section id="donate" className="donate-section">
        <div className="donate-copy">
          <div className="donate-symbols" aria-hidden="true">
            <span>🪙</span>
            <span>🎒</span>
            <span>🥣</span>
            <span>🧥</span>
            <span>🩺</span>
          </div>
          <h2>Donate Dashboard</h2>
          <p>Choose your contribution and complete your donation.</p>
          <blockquote>{form.selectedQuote}</blockquote>
          <div className="qr-card">
            <p>Scan to donate directly</p>
            <QRCodeSVG value={qrPayload} size={160} includeMargin bgColor="#ffffff" fgColor="#172027" />
            <small className="qr-note">QR payload updates by selected payment type and give cycle.</small>
          </div>
        </div>

        <form className="donate-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input required name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            Country
            <input required name="country" value={form.country} onChange={handleChange} />
          </label>
          <label>
            Email
            <input required type="email" name="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            Phone Number
            <input required name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            Amount (USD)
            <input required type="number" min="1" name="amount" value={form.amount} onChange={handleChange} />
          </label>
          <p className="amount-help">Need help? Contact donations@weallwithyou.org | +1 (202) 555-0184</p>

          <p className="consent">
            By providing your phone number you agree that WFP will use the personal information you share
            with us to send you information about our programmes, services and events by SMS, telephone
            (voice) and via messaging platforms i.e. WhatsApp.
          </p>

          <label>
            Give Type
            <select name="donationType" value={form.donationType} onChange={handleChange}>
              <option value="monthly">Give Monthly</option>
              <option value="once">Give Once</option>
            </select>
          </label>

          <label>
            Contribution View Quote
            <select name="selectedQuote" value={form.selectedQuote} onChange={handleChange}>
              {donationQuotes.map((quote) => (
                <option key={quote} value={quote}>
                  {quote}
                </option>
              ))}
            </select>
          </label>

          <label>
            Select Payment Line
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
              <option value="qr">QR Code</option>
              <option value="creditcard">Credit Card</option>
              <option value="debitcard">Debit Card</option>
            </select>
          </label>

          <button className="donate-btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Donate"}
          </button>

          {message && <p className="message">{message}</p>}
        </form>
      </section>

      <section className="dashboard">
        <h2>Global Impact Dashboard</h2>
        <WorldMap />
      </section>

      <section id="admin" className="admin-section">
        <div className="admin-hero">
          <div className="admin-hero-copy">
            <h2>Admin Program Dashboard</h2>
            <p>Create separate support program cards with photo, description and received amount.</p>
          </div>
          <div className="admin-hero-image">
            <div className="admin-hero-image-text">
              <p>Hope starts with you.</p>
              <small>Every act of kindness creates a brighter future.</small>
            </div>
          </div>
        </div>

        {!adminAuth.token ? (
          <div className="admin-auth-wrap">
            <div className="admin-auth-switch">
              <button
                type="button"
                className={adminAuthMode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminAuthMode("login");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={adminAuthMode === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminAuthMode("register");
                }}
              >
                Register
              </button>
            </div>

            <form className="admin-form" onSubmit={handleAdminRegisterOrLogin}>
              {adminAuthMode === "register" && (
                <>
                  <label>
                    Admin Name
                    <input required name="name" value={authForm.name} onChange={handleAuthChange} />
                  </label>
                </>
              )}
              <label>
                Admin Email
                <input required type="email" name="email" value={authForm.email} onChange={handleAuthChange} />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  name="password"
                  minLength="6"
                  value={authForm.password}
                  onChange={handleAuthChange}
                />
              </label>
              <button className="donate-btn" type="submit">
                {adminAuthMode === "register" ? "Register Admin Only" : "Login Admin (Use All)"}
              </button>
              {adminAuthMessage && (
                <p className={adminAuthMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                  {adminAuthMessage}
                </p>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="admin-auth-status">
              <p>
                Logged in as <strong>{adminAuth.admin?.name || adminAuth.admin?.email}</strong> ({adminAuth.admin?.role || "approver"})
              </p>
              <button type="button" className="view-btn" onClick={handleAdminLogout}>
                Logout
              </button>
            </div>

            <div className="admin-tabs">
              <button
                type="button"
                className={adminDashboardTab === "create" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("create");
                }}
              >
                Create Dashboard
              </button>
              <button
                type="button"
                className={adminDashboardTab === "amount" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("amount");
                }}
              >
                Amount Dashboard
              </button>
              <button
                type="button"
                className={adminDashboardTab === "delete" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("delete");
                }}
              >
                Delete Dashboard
              </button>
              <button
                type="button"
                className={adminDashboardTab === "finance" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("finance");
                }}
              >
                Finance Dashboard
              </button>
              <button
                type="button"
                className={adminDashboardTab === "approval" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("approval");
                }}
              >
                Approval Dashboard
              </button>
              <button
                type="button"
                className={adminDashboardTab === "donations" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("donations");
                }}
              >
                Donation Records
              </button>
              <button
                type="button"
                className={adminDashboardTab === "admins" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAdminDashboardTab("admins");
                }}
              >
                Admin Management
              </button>
              <button
                type="button"
                className={adminDashboardTab === "logs" ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setFinanceMessage("");
                  setAdminDashboardTab("logs");
                  setManagementLogsPage(1);
                }}
              >
                Management Logs
              </button>
            </div>

            <div className="admin-single-dashboard">
              {financeMessage && adminDashboardTab === "approval" && (
                <p className={financeMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                  {financeMessage}
                </p>
              )}

              {adminDashboardTab === "create" && (
                <form className="admin-form" onSubmit={handleProgramCreate}>
                  <h3>Create Profile Dashboard</h3>
                  <label>
                    Program Title
                    <input required name="title" value={adminForm.title} onChange={handleAdminChange} />
                  </label>

                  <label>
                    Category
                    <select name="category" value={adminForm.category} onChange={handleAdminChange}>
                      <option value="education">Education</option>
                      <option value="refugees">Refugees</option>
                      <option value="food">Food</option>
                      <option value="community">Community</option>
                    </select>
                  </label>

                  <label>
                    Description
                    <textarea required name="description" rows="4" value={adminForm.description} onChange={handleAdminChange} />
                  </label>

                  <label>
                    Photo URL (or use upload below)
                    <input name="imageUrl" value={adminForm.imageUrl} onChange={handleAdminChange} />
                  </label>

                  <label>
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                  </label>

                  <label>
                    Received Amount (USD)
                    <input
                      type="number"
                      min="0"
                      required
                      name="receivedAmount"
                      value={adminForm.receivedAmount}
                      onChange={handleAdminChange}
                    />
                  </label>

                  {adminForm.imageData && <img className="preview-img" src={adminForm.imageData} alt="Uploaded preview" />}

                  <button className="donate-btn" type="submit">
                    Create Program Dashboard
                  </button>
                  {programMessage && (
                    <p className={programMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                      {programMessage}
                    </p>
                  )}
                </form>
              )}

              {adminDashboardTab === "amount" && (
                <div className="admin-profiles-panel">
                  <h3>Profiles Amount Dashboard</h3>
                  <p>View each profile and update received amount for admin-created profiles.</p>
                  <div className="admin-profile-list">
                    {pagedPrograms.map((program) => {
                      const isDefaultProfile = String(program._id).startsWith("default-");
                      return (
                        <article key={program._id} className="admin-profile-card">
                          <h4>{program.title}</h4>
                          <p className="program-category">Category: {program.category}</p>
                          <label>
                            Received Amount (USD)
                            <input
                              type="number"
                              min="0"
                              value={amountDrafts[program._id] ?? ""}
                              onChange={(event) => handleAmountDraftChange(program._id, event.target.value)}
                              disabled={isDefaultProfile}
                            />
                          </label>
                          <button
                            type="button"
                            className="view-btn"
                            disabled={isDefaultProfile || !isApprover}
                            onClick={() => handleAmountUpdate(program)}
                          >
                            {isDefaultProfile ? "Default Profile" : "Update Amount"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={programListPage <= 1}
                      onClick={() => setProgramListPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {programListPage} / {programTotalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={programListPage >= programTotalPages}
                      onClick={() => setProgramListPage((prev) => Math.min(prev + 1, programTotalPages))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {adminDashboardTab === "delete" && (
                <div className="admin-profiles-panel">
                  <h3>Delete Profile Dashboard</h3>
                  <p>Remove admin-created profiles that are no longer needed.</p>
                  <div className="admin-profile-list">
                    {pagedPrograms.map((program) => {
                      const isDefaultProfile = String(program._id).startsWith("default-");
                      return (
                        <article key={`delete-${program._id}`} className="admin-profile-card">
                          <h4>{program.title}</h4>
                          <p className="program-category">Category: {program.category}</p>
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={isDefaultProfile || !isApprover}
                            onClick={() => openDeleteModal(program)}
                          >
                            {isDefaultProfile ? "Default Profile" : "Delete Profile"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={programListPage <= 1}
                      onClick={() => setProgramListPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {programListPage} / {programTotalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={programListPage >= programTotalPages}
                      onClick={() => setProgramListPage((prev) => Math.min(prev + 1, programTotalPages))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {adminDashboardTab === "finance" && (
                <div className="admin-profiles-panel">
                  <h3>Finance Dashboard</h3>
                  <p>Review donation amounts and create withdraw requests.</p>
                  <div className="finance-stats">
                    <p>Total Received: <strong>${Number(financeOverview.totalReceived || 0).toLocaleString()}</strong></p>
                    <p>Donation Amount Collected: <strong>${Number(financeOverview.totalReceived || 0).toLocaleString()}</strong></p>
                    <p>Total Withdrawn: <strong>${Number(financeOverview.totalWithdrawn || 0).toLocaleString()}</strong></p>
                    <p>Available Balance: <strong>${Number(financeOverview.balance || 0).toLocaleString()}</strong></p>
                    <p>Total Donations: <strong>{Number(financeOverview.donationCount || 0)}</strong></p>
                    <p>Pending Requests: <strong>{Number(financeOverview.pendingRequestCount || 0)}</strong></p>
                    <p>Pending Amount: <strong>${Number(financeOverview.pendingRequestedAmount || 0).toLocaleString()}</strong></p>
                  </div>
                  <form className="admin-form" onSubmit={handleWithdrawRequest}>
                    <label>
                      Withdraw Amount (USD)
                      <input
                        type="number"
                        min="1"
                        name="amount"
                        value={withdrawForm.amount}
                        onChange={handleWithdrawChange}
                        required
                      />
                    </label>
                    <label>
                      Note
                      <input name="note" value={withdrawForm.note} onChange={handleWithdrawChange} />
                    </label>
                    <button className="donate-btn" type="submit">
                      Create Withdraw Request
                    </button>
                    {financeMessage && (
                      <p className={financeMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                        {financeMessage}
                      </p>
                    )}
                  </form>
                  <div className="withdraw-list">
                    <h4>Recent Donation Payments</h4>
                    {financeDonations.length === 0 ? (
                      <p>No donation payments yet.</p>
                    ) : (
                      financeDonations.slice(0, 5).map((item) => (
                        <p key={item._id}>
                          ${Number(item.amount || 0).toLocaleString()} - {item.name} ({item.paymentMethod})
                        </p>
                      ))
                    )}
                  </div>
                  <div className="pager-row">
                    <span>
                      Page {financeDonationsMeta.page} / {financeDonationsMeta.totalPages}
                    </span>
                  </div>
                </div>
              )}

              {adminDashboardTab === "approval" && (
                <div className="admin-profiles-panel">
                  <h3>Approval Dashboard</h3>
                  <p>Approve or reject pending withdrawal requests.</p>
                  <div className="withdraw-list">
                    <h4>Pending Withdraw Requests</h4>
                    {withdrawRequests.filter((item) => item.status === "pending").length === 0 ? (
                      <p>No pending requests.</p>
                    ) : (
                      withdrawRequests
                        .filter((item) => item.status === "pending")
                        .slice(0, 8)
                        .map((item) => (
                          <div key={item._id} className="request-row">
                            <p>
                              ${Number(item.amount || 0).toLocaleString()} - {item.note || "No note"}
                            </p>
                            <div className="request-actions">
                              <button
                                type="button"
                                className="view-btn"
                                disabled={!isApprover}
                                onClick={() => handleReviewRequest(item._id, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="danger-btn"
                                disabled={!isApprover}
                                onClick={() => handleReviewRequest(item._id, "reject")}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={withdrawRequestsMeta.page <= 1}
                      onClick={() => setWithdrawRequestsPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {withdrawRequestsMeta.page} / {withdrawRequestsMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={withdrawRequestsMeta.page >= withdrawRequestsMeta.totalPages}
                      onClick={() =>
                        setWithdrawRequestsPage((prev) => Math.min(prev + 1, withdrawRequestsMeta.totalPages))
                      }
                    >
                      Next
                    </button>
                  </div>
                  <div className="withdraw-list">
                    <h4>Recent Withdrawals</h4>
                    {withdrawals.length === 0 ? (
                      <p>No withdrawals yet.</p>
                    ) : (
                      withdrawals.slice(0, 5).map((item) => (
                        <p key={item._id}>
                          ${Number(item.amount || 0).toLocaleString()} - {item.note || "No note"}
                        </p>
                      ))
                    )}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={withdrawalsMeta.page <= 1}
                      onClick={() => setWithdrawalsPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {withdrawalsMeta.page} / {withdrawalsMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={withdrawalsMeta.page >= withdrawalsMeta.totalPages}
                      onClick={() => setWithdrawalsPage((prev) => Math.min(prev + 1, withdrawalsMeta.totalPages))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {adminDashboardTab === "donations" && (
                <div className="admin-profiles-panel">
                  <h3>Donation Management Dashboard</h3>
                  <p>Track donation amounts and filter records by date range, country, and payment method. You can also export filtered results to CSV.</p>
                  <p className="result-count">
                    Total Results: <strong>{Number(donationRecordsMeta.total || donationRecords.length)}</strong>
                  </p>
                  <form className="donation-filter-form" onSubmit={handleDonationRecordFilterSubmit}>
                    <label>
                      Country
                      <input name="country" value={donationFilters.country} onChange={handleDonationFilterChange} />
                    </label>
                    <label>
                      Payment Method
                      <select name="paymentMethod" value={donationFilters.paymentMethod} onChange={handleDonationFilterChange}>
                        <option value="">All</option>
                        <option value="qr">QR Code</option>
                        <option value="creditcard">Credit Card</option>
                        <option value="debitcard">Debit Card</option>
                      </select>
                    </label>
                    <label>
                      Date From
                      <input type="date" name="dateFrom" value={donationFilters.dateFrom} onChange={handleDonationFilterChange} />
                    </label>
                    <label>
                      Date To
                      <input type="date" name="dateTo" value={donationFilters.dateTo} onChange={handleDonationFilterChange} />
                    </label>
                    <div className="filter-actions">
                      <button className="view-btn" type="submit">
                        Apply Filter
                      </button>
                      <button className="auth-tab" type="button" onClick={clearDonationFilters}>
                        Clear
                      </button>
                      <button className="donate-btn" type="button" onClick={handleExportDonationsCsv}>
                        Export CSV
                      </button>
                    </div>
                  </form>
                  {financeMessage && (
                    <p className={financeMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                      {financeMessage}
                    </p>
                  )}
                  <div className="donation-records-list">
                    {donationRecords.length === 0 ? (
                      <p>No donation records found.</p>
                    ) : (
                      donationRecords.slice(0, 20).map((item) => (
                        <article key={item._id} className="donation-record-card">
                          <p><strong>{item.name}</strong> ({item.email})</p>
                          <p>Amount: ${Number(item.amount || 0).toLocaleString()}</p>
                          <p>Type: {item.donationType}</p>
                          <p>Payment: {item.paymentMethod}</p>
                          <p>Date: {new Date(item.createdAt).toLocaleDateString()}</p>
                        </article>
                      ))
                    )}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={donationRecordsMeta.page <= 1}
                      onClick={() => setDonationRecordsPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {donationRecordsMeta.page} / {donationRecordsMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={donationRecordsMeta.page >= donationRecordsMeta.totalPages}
                      onClick={() =>
                        setDonationRecordsPage((prev) => Math.min(prev + 1, donationRecordsMeta.totalPages))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {adminDashboardTab === "admins" && (
                <div className="admin-profiles-panel">
                  <h3>Admin Management Dashboard</h3>
                  <p>All admins are approver role.</p>
                  <p className="result-count">
                    Total Results: <strong>{filteredAdminUsers.length}</strong>
                  </p>
                  {adminManagementMessage && (
                    <p
                      className={
                        adminManagementMessage.toLowerCase().includes("expired") ? "message warning" : "message"
                      }
                    >
                      {adminManagementMessage}
                    </p>
                  )}
                  <form className="donation-filter-form">
                    <label>
                      Search Name/Email
                      <input
                        name="query"
                        value={adminUserFilters.query}
                        onChange={handleAdminUserFilterChange}
                        placeholder="Search admin"
                      />
                    </label>
                  </form>
                  <div className="admin-profile-list">
                    {filteredAdminUsers.length === 0 ? (
                      <p>No admin users found.</p>
                    ) : (
                      filteredAdminUsers.map((adminItem) => (
                        <article key={adminItem._id} className="admin-profile-card">
                          <h4>{adminItem.name}</h4>
                          <p>{adminItem.email}</p>
                          <p>
                            Role: <strong>Approver</strong>
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}

              {adminDashboardTab === "logs" && (
                <div className="admin-profiles-panel">
                  <h3>Management Log Dashboard</h3>
                  <p>Track register, profile management, approval, and withdraw actions.</p>
                  <p className="result-count">
                    Total Results: <strong>{Number(managementLogsMeta.total || managementLogs.length)}</strong>
                  </p>
                  {financeMessage && (
                    <p className={financeMessage.toLowerCase().includes("expired") ? "message warning" : "message"}>
                      {financeMessage}
                    </p>
                  )}
                  <div className="donation-records-list">
                    {managementLogs.length === 0 ? (
                      <p>No management logs yet.</p>
                    ) : (
                      managementLogs.map((log) => (
                        <article key={log._id} className="donation-record-card">
                          <p><strong>{log.action}</strong></p>
                          <p>Admin: {log.actorEmail || "N/A"}</p>
                          <p>Details: {log.details || "No details"}</p>
                          <p>Date: {new Date(log.createdAt).toLocaleString()}</p>
                        </article>
                      ))
                    )}
                  </div>
                  <div className="pager-row">
                    <button
                      type="button"
                      className="view-btn"
                      disabled={managementLogsMeta.page <= 1}
                      onClick={() => setManagementLogsPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {managementLogsMeta.page} / {managementLogsMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="view-btn"
                      disabled={managementLogsMeta.page >= managementLogsMeta.totalPages}
                      onClick={() =>
                        setManagementLogsPage((prev) => Math.min(prev + 1, managementLogsMeta.totalPages))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </section>

      <section id="about" className="about-section">
        <h2>About Us Dashboard</h2>
        <p>
          We All With You is a humanitarian charity focused on emergency food aid, education continuity, and refugee
          protection across vulnerable communities.
        </p>
        <div className="about-grid">
          <article>
            <img
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85"
              alt="Children learning in a classroom"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = ABOUT_FALLBACK_IMAGE;
              }}
            />
            <h3>Our Purpose</h3>
            <p>Protect lives in crisis and build long-term dignity through reliable support programs.</p>
          </article>
          <article>
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80"
              alt="Food support distribution"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = ABOUT_FALLBACK_IMAGE;
              }}
            />
            <h3>How We Work</h3>
            <p>Local partner networks, transparent donation tracking, and direct aid delivery to communities in need.</p>
          </article>
          <article>
            <img
              src="https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=900&q=80"
              alt="Refugee family support"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = ABOUT_FALLBACK_IMAGE;
              }}
            />
            <h3>Our Promise</h3>
            <p>Every donation is handled with accountability and used for measurable social impact.</p>
          </article>
        </div>
      </section>

      <section className="sponsor-section">
        <h2>Sponsor Dashboard</h2>
        <p>Global sponsors and public partners supporting We All With You.</p>
        <div className="sponsor-grid">
          {sponsorCompanies.map((company) => (
            <article key={company.name} className="sponsor-card">
              <div className="sponsor-fallback-logo" style={{ background: company.color }} aria-hidden="true">
                {company.abbr}
              </div>
              <p>{company.name}</p>
            </article>
          ))}
        </div>
        <p className="public-logo-line">Public logos and trusted institutional partners displayed for transparency.</p>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} We All With You. All rights reserved.</p>
      </footer>

      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Delete profile confirmation">
          <div className="modal-card">
            <h3>Delete Profile?</h3>
            <p>
              This will permanently delete <strong>{deleteTarget.title}</strong>.
            </p>
            <div className="modal-actions">
              <button type="button" className="view-btn" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={async () => {
                  await handleDeleteProfile(deleteTarget);
                  closeDeleteModal();
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {popupMessage && <div className="side-toast">{popupMessage}</div>}
    </div>
  );
}
