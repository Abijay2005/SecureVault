import { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import CredentialCard from "../components/CredentialCard";
import {
  KeyIcon,
  PlusIcon,
  SearchIcon,
  LockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  AlertIcon,
  CheckIcon,
  UsersIcon,
  ActivityIcon,
  LaptopIcon,
  FileTextIcon,
  DownloadIcon,
  StarIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  EditIcon,
} from "../components/Icons";

const API_URL = "http://localhost:8080";

function Vault({ onLogout, goToDashboard }) {
  const [activeTab, setActiveTab] = useState("vault"); // vault, sharing, security, admin

  // User Profile
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "USER";
  const userName = localStorage.getItem("userName") || "";

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Vault state
  const [credentials, setCredentials] = useState([]);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("General");
  const [credentialType, setCredentialType] = useState("LOGIN");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Password Generator & Strength state
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [strengthInfo, setStrengthInfo] = useState(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Sharing state
  const [sharingSubTab, setSharingSubTab] = useState("teams"); // "teams", "individual", "shared_by_me", "manage_teams"
  const [shareTargetType, setShareTargetType] = useState("team"); // "team" or "individual"
  const [shareTeamId, setShareTeamId] = useState("");
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [sharedWithTeams, setSharedWithTeams] = useState([]);
  const [sharedByMe, setSharedByMe] = useState([]);
  const [teamSharesByMe, setTeamSharesByMe] = useState([]);
  const [shareCredId, setShareCredId] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("VIEW_ONLY");
  const [shareExpiryMinutes, setShareExpiryMinutes] = useState(60);

  // Teams state
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Security & Reports state
  const [securityEvents, setSecurityEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("30d");
  const [devices, setDevices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Reports state
  const [selectedReportType, setSelectedReportType] = useState("SECURITY_REPORT");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(
    localStorage.getItem("userMfaEnabled") === "true"
  );
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [backupCodesModal, setBackupCodesModal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  // Admin state
  const [allUsers, setAllUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  // General Status/Message state
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // --- Fetchers ---

  const loadCredentials = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/credentials`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSharingData = async () => {
    if (!token) return;
    try {
      const [resWithMe, resWithTeams, resByMe, resTeamByMe, resTeams] = await Promise.all([
        fetch(`${API_URL}/api/sharing/shared-with-me`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/sharing/shared-with-teams`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/sharing/shared-by-me`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/sharing/team-shares-by-me`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/teams`, { headers: getAuthHeaders() }),
      ]);
      if (resWithMe.ok) setSharedWithMe(await resWithMe.json());
      if (resWithTeams.ok) setSharedWithTeams(await resWithTeams.json());
      if (resByMe.ok) setSharedByMe(await resByMe.json());
      if (resTeamByMe.ok) setTeamSharesByMe(await resTeamByMe.json());
      if (resTeams.ok) setTeams(await resTeams.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSecurityData = async () => {
    if (!token) return;
    try {
      const [resEvents, resAnalytics, resDevices, resNotifs, resSessions, resMfa] = await Promise.all([
        fetch(`${API_URL}/api/security/events`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/security/analytics?timeframe=${analyticsTimeframe}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/security/devices`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/security/notifications`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/auth/sessions`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/auth/mfa/status`, { headers: getAuthHeaders() }),
      ]);
      if (resEvents.ok) setSecurityEvents(await resEvents.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resDevices.ok) setDevices(await resDevices.json());
      if (resNotifs.ok) setNotifications(await resNotifs.json());
      if (resSessions.ok) setSessions(await resSessions.json());
      if (resMfa.ok) {
        const mfaData = await resMfa.json();
        setMfaEnabled(Boolean(mfaData.mfaEnabled));
        localStorage.setItem("userMfaEnabled", String(mfaData.mfaEnabled));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadReportData = async (type) => {
    if (!token) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/${type}/data`, { headers: getAuthHeaders() });
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!token || userRole !== "ADMINISTRATOR") return;
    try {
      const [resUsers, resStats] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() }),
      ]);
      if (resUsers.ok) setAllUsers(await resUsers.json());
      if (resStats.ok) setAdminStats(await resStats.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchAllData = async () => {
      if (!token) return;
      try {
        const [resCred, resWithMe, resWithTeams, resByMe, resTeamByMe, resTeams, resEvents, resAnalytics, resDevices, resNotifs, resSessions] =
          await Promise.all([
            fetch(`${API_URL}/api/credentials`, { headers }),
            fetch(`${API_URL}/api/sharing/shared-with-me`, { headers }),
            fetch(`${API_URL}/api/sharing/shared-with-teams`, { headers }),
            fetch(`${API_URL}/api/sharing/shared-by-me`, { headers }),
            fetch(`${API_URL}/api/sharing/team-shares-by-me`, { headers }),
            fetch(`${API_URL}/api/teams`, { headers }),
            fetch(`${API_URL}/api/security/events`, { headers }),
            fetch(`${API_URL}/api/security/analytics?timeframe=${analyticsTimeframe}`, { headers }),
            fetch(`${API_URL}/api/security/devices`, { headers }),
            fetch(`${API_URL}/api/security/notifications`, { headers }),
            fetch(`${API_URL}/api/auth/sessions`, { headers }),
          ]);

        if (isMounted) {
          if (resCred.ok) setCredentials(await resCred.json());
          if (resWithMe.ok) setSharedWithMe(await resWithMe.json());
          if (resWithTeams.ok) setSharedWithTeams(await resWithTeams.json());
          if (resByMe.ok) setSharedByMe(await resByMe.json());
          if (resTeamByMe.ok) setTeamSharesByMe(await resTeamByMe.json());
          if (resTeams.ok) setTeams(await resTeams.json());
          if (resEvents.ok) setSecurityEvents(await resEvents.json());
          if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
          if (resDevices.ok) setDevices(await resDevices.json());
          if (resNotifs.ok) setNotifications(await resNotifs.json());
          if (resSessions.ok) setSessions(await resSessions.json());
        }

        if (userRole === "ADMINISTRATOR") {
          const [resUsers, resStats] = await Promise.all([
            fetch(`${API_URL}/api/admin/users`, { headers }),
            fetch(`${API_URL}/api/admin/stats`, { headers }),
          ]);
          if (isMounted) {
            if (resUsers.ok) setAllUsers(await resUsers.json());
            if (resStats.ok) setAdminStats(await resStats.json());
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    };

    fetchAllData();
    loadReportData(selectedReportType);

    return () => {
      isMounted = false;
    };
  }, [token, analyticsTimeframe, userRole]);

  // --- Password Strength & Generator ---

  const handlePasswordChange = async (val) => {
    setPassword(val);
    if (!val) {
      setStrengthInfo(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/tools/password/strength`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: val }),
      });
      if (res.ok) setStrengthInfo(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tools/password/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length: parseInt(genLength, 10),
          useUpper,
          useLower,
          useDigits,
          useSymbols,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPassword(data.password);
        setStrengthInfo(data.strength);
        setFeedback("Generated high-entropy secure password!");
        setTimeout(() => setFeedback(""), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Vault Modal & CRUD ---

  const openAddModal = () => {
    setEditingId(null);
    setTitle("");
    setUsername("");
    setPassword("");
    setCategory("General");
    setCredentialType("LOGIN");
    setUrl("");
    setNotes("");
    setIsFavorite(false);
    setStrengthInfo(null);
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cred) => {
    setIsSharedEdit(false);
    setEditingId(cred.id);
    setTitle(cred.title || "");
    setUsername(cred.username || "");
    setPassword(cred.password || "");
    setCategory(cred.category || "General");
    setCredentialType(cred.credentialType || "LOGIN");
    setUrl(cred.url || "");
    setNotes(cred.notes || "");
    setIsFavorite(!!cred.isFavorite);
    setShowModalPassword(false);
    if (cred.password) {
      handlePasswordChange(cred.password);
    }
    setIsModalOpen(true);
  };

  const openEditSharedModal = (cred) => {
    setIsSharedEdit(true);
    setEditingId(cred.id);
    setTitle(cred.title || "");
    setUsername(cred.username || "");
    setPassword(cred.password || "");
    setCategory(cred.category || "General");
    setCredentialType(cred.credentialType || "LOGIN");
    setUrl(cred.url || "");
    setNotes(cred.notes || "");
    setIsFavorite(false);
    setShowModalPassword(false);
    if (cred.password) {
      handlePasswordChange(cred.password);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setIsSharedEdit(false);
    setTitle("");
    setUsername("");
    setPassword("");
    setCategory("General");
    setCredentialType("LOGIN");
    setUrl("");
    setNotes("");
    setIsFavorite(false);
    setStrengthInfo(null);
  };

  const handleVaultSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    const payload = {
      title,
      username,
      password,
      category,
      credentialType,
      url,
      notes,
      isFavorite,
    };
    const urlEndpoint = editingId
      ? isSharedEdit
        ? `${API_URL}/api/sharing/credential/${editingId}`
        : `${API_URL}/api/credentials/${editingId}`
      : `${API_URL}/api/credentials`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(urlEndpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Operation failed");
      }

      closeModal();
      setFeedback(
        editingId
          ? "Credential updated successfully!"
          : "Credential saved with AES-256 GCM encryption!"
      );
      setTimeout(() => setFeedback(""), 4000);
      loadCredentials();
      loadSharingData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/credentials/${id}/favorite`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCredentials((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this credential from your vault?")) return;
    try {
      const res = await fetch(`${API_URL}/api/credentials/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      setFeedback("Credential permanently removed.");
      setTimeout(() => setFeedback(""), 3000);
      loadCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setFeedback("Copied to clipboard!");
    setTimeout(() => setFeedback(""), 2500);
  };

  // --- Sharing Handlers ---

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    if (!shareCredId) {
      setError("Please select a vault item to share.");
      return;
    }

    try {
      if (shareTargetType === "team") {
        if (!shareTeamId) {
          setError("Please select a team to share with.");
          return;
        }

        const res = await fetch(`${API_URL}/api/sharing/team`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            credentialId: parseInt(shareCredId, 10),
            teamId: parseInt(shareTeamId, 10),
            permission: sharePermission,
            expirationMinutes: shareExpiryMinutes > 0 ? parseInt(shareExpiryMinutes, 10) : null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Team sharing failed");
        const selectedTeam = teams.find((t) => String(t.id) === String(shareTeamId));
        const teamName = selectedTeam ? selectedTeam.name : "Team";
        setFeedback(`Credential shared with entire team "${teamName}" (${sharePermission})!`);
        setTimeout(() => setFeedback(""), 4500);
        setShareTeamId("");
        loadSharingData();
      } else {
        if (!shareEmail.trim()) {
          setError("Please enter a recipient email address.");
          return;
        }

        const res = await fetch(`${API_URL}/api/sharing/share`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            credentialId: parseInt(shareCredId, 10),
            targetEmail: shareEmail.trim(),
            permission: sharePermission,
            expirationMinutes: shareExpiryMinutes > 0 ? parseInt(shareExpiryMinutes, 10) : null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Individual sharing failed");
        setFeedback(`Credential shared with ${shareEmail} (${sharePermission})!`);
        setTimeout(() => setFeedback(""), 4500);
        setShareEmail("");
        loadSharingData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      const res = await fetch(`${API_URL}/api/sharing/revoke/${shareId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Revocation failed");
      setFeedback("Individual share revoked.");
      setTimeout(() => setFeedback(""), 3000);
      loadSharingData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeTeamShare = async (teamShareId) => {
    try {
      const res = await fetch(`${API_URL}/api/sharing/team-share/${teamShareId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Team share revocation failed");
      }
      setFeedback("Team share access revoked.");
      setTimeout(() => setFeedback(""), 3000);
      loadSharingData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      const res = await fetch(`${API_URL}/api/teams`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newTeamName }),
      });
      if (res.ok) {
        setNewTeamName("");
        setFeedback("Team created successfully!");
        setTimeout(() => setFeedback(""), 3000);
        loadSharingData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (teamId) => {
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${API_URL}/api/teams/${teamId}/members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: "MEMBER" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add member");
      setInviteEmail("");
      setFeedback("Team member invitation sent!");
      setTimeout(() => setFeedback(""), 3000);
      loadTeamMembers(teamId);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTeamMembers = async (teamId) => {
    setSelectedTeamId(teamId);
    try {
      const res = await fetch(`${API_URL}/api/teams/${teamId}/members`, { headers: getAuthHeaders() });
      if (res.ok) {
        const members = await res.json();
        setTeamMembers((prev) => ({ ...prev, [teamId]: members }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Security & MFA Handlers ---

  const handleSetupMfa = async () => {
    setMfaLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/mfa/setup`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to initiate MFA setup");
      setMfaSetupData(data);
      setMfaVerifyCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/mfa/enable`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: mfaVerifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to enable MFA");
      setMfaEnabled(true);
      localStorage.setItem("userMfaEnabled", "true");
      setMfaSetupData(null);
      setMfaVerifyCode("");
      if (data.backupCodes && data.backupCodes.length > 0) {
        setBackupCodesModal(data.backupCodes);
      }
      setFeedback("Two-Factor Authentication is active! Your vault is now securely protected.");
      setTimeout(() => setFeedback(""), 4500);
      loadSecurityData();
    } catch (err) {
      setError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your vault will only be protected by your master password.")) {
      return;
    }
    setMfaLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/mfa/disable`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to disable MFA");
      setMfaEnabled(false);
      localStorage.setItem("userMfaEnabled", "false");
      setFeedback("Two-Factor Authentication has been disabled.");
      setTimeout(() => setFeedback(""), 4000);
      loadSecurityData();
    } catch (err) {
      setError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!window.confirm("Generating new backup codes will invalidate any previously generated backup codes. Proceed?")) {
      return;
    }
    setMfaLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/mfa/backup-codes/regenerate`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to regenerate backup codes");
      setBackupCodesModal(data.backupCodes);
      setFeedback("New backup recovery codes generated.");
      setTimeout(() => setFeedback(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const copyMfaToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === "backup") {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const handleToggleTrust = async (deviceId, currentTrust) => {
    try {
      const res = await fetch(`${API_URL}/api/security/devices/${deviceId}/trust?trusted=${!currentTrust}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setFeedback("Device trust status updated.");
        setTimeout(() => setFeedback(""), 3000);
        loadSecurityData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    try {
      const res = await fetch(`${API_URL}/api/security/devices/${deviceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setFeedback("Device access revoked.");
        setTimeout(() => setFeedback(""), 3000);
        loadSecurityData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkNotification = async (id) => {
    try {
      await fetch(`${API_URL}/api/security/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      loadSecurityData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setFeedback("Session terminated.");
        setTimeout(() => setFeedback(""), 3000);
        loadSecurityData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Report Download Handlers ---

  const handleDownloadReport = async (format) => {
    try {
      const endpoint = `${API_URL}/api/reports/${selectedReportType}/export/${format}`;
      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `SecureVault_${selectedReportType.toLowerCase()}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setFeedback(`Downloaded ${selectedReportType} as ${format.toUpperCase()}!`);
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Admin Handlers ---

  const handleUpdateRole = async (userId, role) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setFeedback("User role updated successfully.");
        setTimeout(() => setFeedback(""), 3000);
        loadAdminData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered credentials list based on search, category, and favorite filters
  const filteredCredentials = useMemo(() => {
    let result = credentials;

    if (onlyFavorites) {
      result = result.filter((c) => !!c.isFavorite);
    }

    if (selectedCategory === "SECURE_NOTE") {
      result = result.filter((c) => c.credentialType === "SECURE_NOTE");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.username && c.username.toLowerCase().includes(q)) ||
          (c.url && c.url.toLowerCase().includes(q))
      );
    }

    return result;
  }, [credentials, searchQuery, selectedCategory, onlyFavorites]);

  const unreadAlertsCount = notifications.filter((n) => !n.readStatus).length;

  const categoriesList = ["ALL", "SECURE_NOTE"];

  return (
    <div className="vault-container">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        userRole={userRole}
        credentialsCount={credentials.length}
        sharedCount={sharedWithMe.length + sharedWithTeams.length}
        unreadAlertsCount={unreadAlertsCount}
        onLogout={onLogout}
        goToDashboard={goToDashboard}
      />

      <main className="vault-content">
        {/* Banner Feedback / Error Notifications */}
        {feedback && (
          <div className="feedback-banner success" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckIcon size={16} />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ color: "inherit", width: "24px", height: "24px" }}
              onClick={() => setFeedback("")}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="feedback-banner error" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertIcon size={16} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="btn-icon"
              style={{ color: "inherit", width: "24px", height: "24px" }}
              onClick={() => setError("")}
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================
            TAB 1: VAULT (MAIN FOCUS)
           ========================================================= */}
        {activeTab === "vault" && (
          <div>
            {/* Header & Search / Add Toolbar */}
            <div className="vault-header-bar">
              <div className="vault-header-title-group">
                <h1>Encrypted Vault</h1>
                <p>
                  Welcome back, <strong>{userName || userEmail}</strong>. Zero-Knowledge AES-256 Storage.
                </p>
              </div>

              <div className="vault-toolbar">
                <div className="search-box">
                  <span className="search-icon">
                    <SearchIcon size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search titles, usernames, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px" }}
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddModal}
                >
                  <PlusIcon size={16} />
                  <span>Add Credential</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <button
                type="button"
                className={`btn ${selectedCategory === "ALL" && !onlyFavorites ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => {
                  setSelectedCategory("ALL");
                  setOnlyFavorites(false);
                }}
              >
                <span>All Items</span>
              </button>

              <button
                type="button"
                className={`btn ${onlyFavorites ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => {
                  setOnlyFavorites(!onlyFavorites);
                  setSelectedCategory("ALL");
                }}
              >
                <StarIcon size={14} filled={onlyFavorites} />
                <span>Favorites</span>
              </button>

              <button
                type="button"
                className={`btn ${selectedCategory === "SECURE_NOTE" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => {
                  setSelectedCategory(selectedCategory === "SECURE_NOTE" ? "ALL" : "SECURE_NOTE");
                  setOnlyFavorites(false);
                }}
              >
                <span>📝 Secure Notes</span>
              </button>
            </div>

            {/* Credential Cards Grid */}
            {filteredCredentials.length === 0 ? (
              <div className="vault-empty-state">
                <div className="empty-icon-wrap">
                  <KeyIcon size={28} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
                  {searchQuery || onlyFavorites || selectedCategory !== "ALL"
                    ? "No matching credentials found"
                    : "Your Vault is empty"}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", marginBottom: "18px" }}>
                  {searchQuery || onlyFavorites || selectedCategory !== "ALL"
                    ? "Try adjusting your category filter or search query."
                    : "Store your passwords, API keys, secure notes, and credentials encrypted with zero knowledge."}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    searchQuery || onlyFavorites || selectedCategory !== "ALL"
                      ? () => {
                          setSearchQuery("");
                          setSelectedCategory("ALL");
                          setOnlyFavorites(false);
                        }
                      : openAddModal
                  }
                >
                  {searchQuery || onlyFavorites || selectedCategory !== "ALL"
                    ? "Reset Filters"
                    : "+ Add Your First Item"}
                </button>
              </div>
            ) : (
              <div className="credential-grid">
                {filteredCredentials.map((cred) => (
                  <CredentialCard
                    key={cred.id}
                    credential={cred}
                    isRevealed={!!revealedPasswords[cred.id]}
                    onToggleReveal={() => toggleReveal(cred.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: SHARING & TEAMS
           ========================================================= */}
        {activeTab === "sharing" && (
          <div>
            <div className="vault-header-bar">
              <div className="vault-header-title-group">
                <h1>Sharing & Team Collaboration</h1>
                <p>Granular encrypted credential sharing: choose between whole-team access or direct peer-to-peer individual sharing.</p>
              </div>
            </div>

            {/* Sharing Perspective Sub-Navigation */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px",
              }}
            >
              <button
                type="button"
                className={`btn ${sharingSubTab === "teams" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSharingSubTab("teams")}
                style={{ borderRadius: "var(--radius-full)", padding: "8px 18px", fontSize: "13.5px" }}
              >
                <span>🏢 Team Vault Shares</span>
                <span
                  style={{
                    background: sharingSubTab === "teams" ? "rgba(255,255,255,0.25)" : "var(--bg-surface-hover)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: "700",
                    marginLeft: "6px",
                  }}
                >
                  {sharedWithTeams.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn ${sharingSubTab === "individual" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSharingSubTab("individual")}
                style={{ borderRadius: "var(--radius-full)", padding: "8px 18px", fontSize: "13.5px" }}
              >
                <span>👤 Individual Shares</span>
                <span
                  style={{
                    background: sharingSubTab === "individual" ? "rgba(255,255,255,0.25)" : "var(--bg-surface-hover)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: "700",
                    marginLeft: "6px",
                  }}
                >
                  {sharedWithMe.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn ${sharingSubTab === "shared_by_me" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSharingSubTab("shared_by_me")}
                style={{ borderRadius: "var(--radius-full)", padding: "8px 18px", fontSize: "13.5px" }}
              >
                <span>📤 Active Shares Granted</span>
                <span
                  style={{
                    background: sharingSubTab === "shared_by_me" ? "rgba(255,255,255,0.25)" : "var(--bg-surface-hover)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: "700",
                    marginLeft: "6px",
                  }}
                >
                  {sharedByMe.length + teamSharesByMe.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn ${sharingSubTab === "manage_teams" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSharingSubTab("manage_teams")}
                style={{ borderRadius: "var(--radius-full)", padding: "8px 18px", fontSize: "13.5px" }}
              >
                <UsersIcon size={16} />
                <span>Team Organizations</span>
                <span
                  style={{
                    background: sharingSubTab === "manage_teams" ? "rgba(255,255,255,0.25)" : "var(--bg-surface-hover)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    fontWeight: "700",
                    marginLeft: "6px",
                  }}
                >
                  {teams.length}
                </span>
              </button>
            </div>

            {/* Share a Credential Form Panel */}
            <section className="section-panel" style={{ marginBottom: "24px" }}>
              <div className="section-panel-header">
                <h2 className="section-panel-title">
                  <KeyIcon size={18} /> Share Encrypted Credential
                </h2>
              </div>

              {/* Mode Toggle: Team Sharing vs Individual Sharing */}
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--bg-input)",
                  padding: "4px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "16px",
                  gap: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShareTargetType("team")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    background: shareTargetType === "team" ? "var(--accent-primary)" : "transparent",
                    color: shareTargetType === "team" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  🏢 Share with Entire Team
                </button>
                <button
                  type="button"
                  onClick={() => setShareTargetType("individual")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    background: shareTargetType === "individual" ? "var(--accent-primary)" : "transparent",
                    color: shareTargetType === "individual" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  👤 Share with Individual User
                </button>
              </div>

              <form onSubmit={handleShareSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                  {/* Select Vault Item */}
                  <div className="form-group">
                    <label className="form-label">Select Vault Item</label>
                    <select
                      className="input-field"
                      value={shareCredId}
                      onChange={(e) => setShareCredId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose from your vault --</option>
                      {credentials.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Selector: Team Dropdown vs Recipient Email */}
                  {shareTargetType === "team" ? (
                    <div className="form-group">
                      <label className="form-label">Target Team Organization</label>
                      {teams.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "var(--warning-text)", padding: "10px 0" }}>
                          No teams found.{" "}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setSharingSubTab("manage_teams")}
                            style={{ textDecoration: "underline", fontWeight: "600" }}
                          >
                            Create a Team first
                          </button>{" "}
                          or switch to Individual Sharing above.
                        </div>
                      ) : (
                        <select
                          className="input-field"
                          value={shareTeamId}
                          onChange={(e) => setShareTeamId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose a team to grant access --</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              👥 {t.name} (Owner: {t.owner?.email})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Recipient Email Address</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="teammate@company.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Explanatory Banner based on mode */}
                {shareTargetType === "team" ? (
                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      fontSize: "12.5px",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>ℹ️</span>
                    <span>
                      <strong>Team Sharing:</strong> All current and future members of the selected team will immediately gain access according to the permission policy below.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      fontSize: "12.5px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>ℹ️</span>
                    <span>
                      <strong>Individual Sharing:</strong> Creates a direct, encrypted 1-on-1 share specifically tied to this colleague's email address.
                    </span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Permission Policy</label>
                    <select
                      className="input-field"
                      value={sharePermission}
                      onChange={(e) => setSharePermission(e.target.value)}
                    >
                      <option value="VIEW_ONLY">VIEW_ONLY (Can view & copy credentials only)</option>
                      <option value="EDIT_ACCESS">EDIT_ACCESS (Can modify password & details)</option>
                      <option value="FULL_MANAGEMENT">FULL_MANAGEMENT (Can edit & delegate shares)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Expiration</span>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>0 = Never expires</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="number"
                        className="input-field"
                        value={shareExpiryMinutes}
                        onChange={(e) => setShareExpiryMinutes(e.target.value)}
                        min="0"
                        placeholder="60"
                        style={{ maxWidth: "140px" }}
                      />
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                          onClick={() => setShareExpiryMinutes(60)}
                        >
                          1h
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                          onClick={() => setShareExpiryMinutes(1440)}
                        >
                          24h
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                          onClick={() => setShareExpiryMinutes(10080)}
                        >
                          7d
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                          onClick={() => setShareExpiryMinutes(0)}
                        >
                          Permanent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "4px" }}
                  disabled={shareTargetType === "team" && teams.length === 0}
                >
                  {shareTargetType === "team" ? "🏢 Share with Entire Team" : "👤 Share with Teammate"}
                </button>
              </form>
            </section>

            {/* =========================================================
                SUB-TAB 1: TEAM VAULT SHARES
               ========================================================= */}
            {sharingSubTab === "teams" && (
              <section className="section-panel">
                <div className="section-panel-header">
                  <div>
                    <h2 className="section-panel-title">
                      🏢 Team Vault Shares ({sharedWithTeams.length})
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Credentials shared with entire teams that you belong to. All team members have synchronized access.
                    </p>
                  </div>
                </div>

                {sharedWithTeams.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-surface-raised)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px dashed var(--border-medium)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏢</div>
                    <h3 style={{ fontSize: "15px", marginBottom: "4px", color: "var(--text-primary)" }}>
                      No Team Shares Received Yet
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto" }}>
                      When credentials are shared with any team you belong to, they will automatically appear here for you and your teammates.
                    </p>
                  </div>
                ) : (
                  <div className="credential-grid">
                    {sharedWithTeams.map((share) => (
                      <div
                        key={share.id}
                        className="credential-card"
                        style={{ borderLeft: "4px solid var(--accent-primary)" }}
                      >
                        <div>
                          <div className="card-top">
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: "700",
                                    background: "var(--accent-glow)",
                                    color: "var(--accent-cyan)",
                                    padding: "3px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid rgba(56, 189, 248, 0.3)",
                                  }}
                                >
                                  👥 Team: {share.team?.name}
                                </span>
                                <span className="card-badge-enc">{share.permission}</span>
                              </div>
                              <h3 className="card-title-text">{share.credential?.title}</h3>
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Shared By</div>
                                <div className="field-value">{share.owner?.email}</div>
                              </div>
                            </div>

                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Username / Identity</div>
                                <div className="field-value mono-text">{share.credential?.username}</div>
                              </div>
                              <button
                                type="button"
                                className="btn-copy-action"
                                onClick={() => copyToClipboard(share.credential?.username)}
                              >
                                Copy
                              </button>
                            </div>

                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Secret Password</div>
                                <div className="field-value mono-text">
                                  {revealedPasswords[`t-${share.id}`]
                                    ? share.credential?.password
                                    : "••••••••••••"}
                                </div>
                              </div>
                              <div className="field-actions">
                                <button
                                  type="button"
                                  className="btn-copy-action"
                                  onClick={() => toggleReveal(`t-${share.id}`)}
                                >
                                  {revealedPasswords[`t-${share.id}`] ? "Hide" : "Reveal"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-copy-action"
                                  onClick={() => copyToClipboard(share.credential?.password)}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {share.credential?.url && (
                              <div className="credential-field-box">
                                <div>
                                  <div className="field-label">Website URL</div>
                                  <div className="field-value" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <a href={share.credential.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)", fontSize: "13px" }}>
                                      {share.credential.url}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {share.credential?.notes && (
                              <div className="credential-field-box">
                                <div>
                                  <div className="field-label">Notes</div>
                                  <div className="field-value" style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                                    {share.credential.notes}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                          {share.expiresAt ? (
                            <div style={{ fontSize: "11.5px", color: "var(--warning-text)" }}>
                              ⏳ Expires: {new Date(share.expiresAt).toLocaleString()}
                            </div>
                          ) : (
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                              ♾️ Permanent Team Share
                            </div>
                          )}

                          {(share.permission === "EDIT_ACCESS" || share.permission === "FULL_MANAGEMENT") && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              onClick={() => openEditSharedModal(share.credential)}
                            >
                              <EditIcon size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* =========================================================
                SUB-TAB 2: INDIVIDUAL 1-ON-1 SHARES
               ========================================================= */}
            {sharingSubTab === "individual" && (
              <section className="section-panel">
                <div className="section-panel-header">
                  <div>
                    <h2 className="section-panel-title">
                      👤 Credentials Shared With You ({sharedWithMe.length})
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Direct peer-to-peer credential grants shared specifically with your email address.
                    </p>
                  </div>
                </div>

                {sharedWithMe.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-surface-raised)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px dashed var(--border-medium)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>👤</div>
                    <h3 style={{ fontSize: "15px", marginBottom: "4px", color: "var(--text-primary)" }}>
                      No Individual Shares Received
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto" }}>
                      When a teammate shares an individual credential directly to your email, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="credential-grid">
                    {sharedWithMe.map((share) => (
                      <div
                        key={share.id}
                        className="credential-card"
                        style={{ borderLeft: "4px solid var(--accent-cyan)" }}
                      >
                        <div>
                          <div className="card-top">
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: "700",
                                    background: "rgba(16, 185, 129, 0.12)",
                                    color: "var(--success-text)",
                                    padding: "3px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px solid rgba(16, 185, 129, 0.28)",
                                  }}
                                >
                                  👤 1-on-1 Share
                                </span>
                                <span className="card-badge-enc">{share.permission}</span>
                              </div>
                              <h3 className="card-title-text">{share.credential?.title}</h3>
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Owner</div>
                                <div className="field-value">{share.owner?.email}</div>
                              </div>
                            </div>

                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Username</div>
                                <div className="field-value mono-text">{share.credential?.username}</div>
                              </div>
                              <button
                                type="button"
                                className="btn-copy-action"
                                onClick={() => copyToClipboard(share.credential?.username)}
                              >
                                Copy
                              </button>
                            </div>

                            <div className="credential-field-box">
                              <div>
                                <div className="field-label">Password</div>
                                <div className="field-value mono-text">
                                  {revealedPasswords[`s-${share.id}`]
                                    ? share.credential?.password
                                    : "••••••••••••"}
                                </div>
                              </div>
                              <div className="field-actions">
                                <button
                                  type="button"
                                  className="btn-copy-action"
                                  onClick={() => toggleReveal(`s-${share.id}`)}
                                >
                                  {revealedPasswords[`s-${share.id}`] ? "Hide" : "Reveal"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-copy-action"
                                  onClick={() => copyToClipboard(share.credential?.password)}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {share.credential?.url && (
                              <div className="credential-field-box">
                                <div>
                                  <div className="field-label">Website URL</div>
                                  <div className="field-value" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <a href={share.credential.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)", fontSize: "13px" }}>
                                      {share.credential.url}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {share.credential?.notes && (
                              <div className="credential-field-box">
                                <div>
                                  <div className="field-label">Notes</div>
                                  <div className="field-value" style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                                    {share.credential.notes}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                          {share.expiresAt ? (
                            <div style={{ fontSize: "11.5px", color: "var(--warning-text)" }}>
                              ⏳ Expires: {new Date(share.expiresAt).toLocaleString()}
                            </div>
                          ) : (
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                              ♾️ Permanent Direct Share
                            </div>
                          )}

                          {(share.permission === "EDIT_ACCESS" || share.permission === "FULL_MANAGEMENT") && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              onClick={() => openEditSharedModal(share.credential)}
                            >
                              <EditIcon size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* =========================================================
                SUB-TAB 3: ACTIVE SHARES GRANTED BY ME
               ========================================================= */}
            {sharingSubTab === "shared_by_me" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 1. Team Shares Granted By Me */}
                <section className="section-panel">
                  <div className="section-panel-header">
                    <div>
                      <h2 className="section-panel-title">
                        🏢 Team Shares Granted By You ({teamSharesByMe.length})
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Credentials you shared with entire teams. Revoking will remove access for all team members.
                      </p>
                    </div>
                  </div>

                  {teamSharesByMe.length === 0 ? (
                    <p className="text-secondary" style={{ fontSize: "13.5px" }}>
                      You have not shared any credentials with teams yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {teamSharesByMe.map((share) => (
                        <div
                          key={share.id}
                          style={{
                            background: "var(--bg-surface-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            padding: "14px 18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: "var(--accent-glow)",
                                  color: "var(--accent-cyan)",
                                  padding: "2px 7px",
                                  borderRadius: "var(--radius-sm)",
                                }}
                              >
                                👥 Team: {share.team?.name}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                Permission: <strong>{share.permission}</strong>
                              </span>
                            </div>
                            <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                              {share.credential?.title}
                            </strong>{" "}
                            <span className="mono-text" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                              ({share.credential?.username})
                            </span>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {share.expiresAt
                                ? `⏳ Expires: ${new Date(share.expiresAt).toLocaleString()}`
                                : "♾️ Permanent share"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: "6px 14px", fontSize: "12.5px" }}
                            onClick={() => handleRevokeTeamShare(share.id)}
                          >
                            Revoke Team Access
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 2. Individual Shares Granted By Me */}
                <section className="section-panel">
                  <div className="section-panel-header">
                    <div>
                      <h2 className="section-panel-title">
                        👤 Individual Shares Granted By You ({sharedByMe.length})
                      </h2>
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Credentials you shared directly 1-on-1 with individual teammates.
                      </p>
                    </div>
                  </div>

                  {sharedByMe.length === 0 ? (
                    <p className="text-secondary" style={{ fontSize: "13.5px" }}>
                      You have not shared any credentials directly with individuals yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sharedByMe.map((share) => (
                        <div
                          key={share.id}
                          style={{
                            background: "var(--bg-surface-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            padding: "14px 18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: "rgba(16, 185, 129, 0.12)",
                                  color: "var(--success-text)",
                                  padding: "2px 7px",
                                  borderRadius: "var(--radius-sm)",
                                }}
                              >
                                👤 Direct Colleague
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                Permission: <strong>{share.permission}</strong>
                              </span>
                            </div>
                            <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                              {share.credential?.title}
                            </strong>{" "}
                            shared with{" "}
                            <span style={{ color: "var(--accent-cyan)", fontWeight: "600" }}>
                              {share.sharedWithUser?.email}
                            </span>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {share.expiresAt
                                ? `⏳ Expires: ${new Date(share.expiresAt).toLocaleString()}`
                                : "♾️ Permanent share"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: "6px 14px", fontSize: "12.5px" }}
                            onClick={() => handleRevokeShare(share.id)}
                          >
                            Revoke User Access
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* =========================================================
                SUB-TAB 4: TEAM ORGANIZATIONS
               ========================================================= */}
            {sharingSubTab === "manage_teams" && (
              <section className="section-panel">
                <div className="section-panel-header">
                  <div>
                    <h2 className="section-panel-title">
                      <UsersIcon size={18} /> Team Organizations ({teams.length})
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Create and manage teams to easily distribute vault credentials to groups of colleagues at once.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateTeam} style={{ display: "flex", gap: "10px", marginBottom: "20px", maxWidth: "520px" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="New Team Name (e.g. Core Engineering, DevOps, SecOps)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                    + Create Team
                  </button>
                </form>

                {teams.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-surface-raised)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px dashed var(--border-medium)",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>👥</div>
                    <h3 style={{ fontSize: "15px", marginBottom: "4px", color: "var(--text-primary)" }}>
                      No Team Organizations Yet
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto" }}>
                      Create a team using the form above, invite your colleagues, and start sharing credentials with entire teams in one click!
                    </p>
                  </div>
                ) : (
                  <div className="credential-grid">
                    {teams.map((team) => (
                      <div key={team.id} className="credential-card">
                        <div>
                          <div className="card-top">
                            <div>
                              <h3 className="card-title-text" style={{ fontSize: "16px" }}>👥 {team.name}</h3>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                                Owner: {team.owner?.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "14px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ width: "100%", fontSize: "13px" }}
                            onClick={() => loadTeamMembers(team.id)}
                          >
                            {selectedTeamId === team.id ? "Hide Team Members" : "View & Manage Members"}
                          </button>

                          {selectedTeamId === team.id && (
                            <div
                              style={{
                                marginTop: "12px",
                                background: "var(--bg-surface-raised)",
                                border: "1px solid var(--border-subtle)",
                                padding: "14px",
                                borderRadius: "var(--radius-md)",
                              }}
                            >
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                                Invite New Member
                              </div>
                              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                <input
                                  type="email"
                                  className="input-field"
                                  placeholder="teammate@company.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  style={{ padding: "7px 10px", fontSize: "12.5px" }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{ padding: "7px 14px", fontSize: "12.5px" }}
                                  onClick={() => handleAddMember(team.id)}
                                >
                                  Invite
                                </button>
                              </div>

                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>
                                Current Members ({(teamMembers[team.id] || []).length})
                              </div>
                              <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                                {(teamMembers[team.id] || []).map((m) => (
                                  <li key={m.id} style={{ marginBottom: "5px" }}>
                                    {m.user?.email}{" "}
                                    <strong style={{ color: "var(--accent-cyan)", fontSize: "11.5px" }}>
                                      ({m.role})
                                    </strong>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: SECURITY CENTER, ANALYTICS & EXECUTIVE REPORTS
           ========================================================= */}
        {activeTab === "security" && (
          <div>
            <div className="vault-header-bar">
              <div className="vault-header-title-group">
                <h1>Security Center & Executive Reports</h1>
                <p>Real-time audit telemetry, password health compliance, and downloadable security reports.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="text-secondary" style={{ fontSize: "13px" }}>Timeframe:</span>
                <select
                  className="input-field"
                  style={{ width: "130px", padding: "8px 12px" }}
                  value={analyticsTimeframe}
                  onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* KPI Metric Cards */}
            {analytics && (
              <div className="analytics-grid">
                <div className="kpi-card" style={{ borderLeft: "4px solid var(--success)" }}>
                  <div className="kpi-title">Successful Sign-Ins</div>
                  <div className="kpi-value" style={{ color: "var(--success)" }}>{analytics.successfulLogins}</div>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid var(--danger)" }}>
                  <div className="kpi-title">Failed Sign-In Attempts</div>
                  <div className="kpi-value" style={{ color: "var(--danger)" }}>{analytics.failedLogins}</div>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid var(--warning)" }}>
                  <div className="kpi-title">Suspicious Events Detected</div>
                  <div className="kpi-value" style={{ color: "var(--warning)" }}>{analytics.suspiciousEvents}</div>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid #a855f7" }}>
                  <div className="kpi-title">Active Security Alerts</div>
                  <div className="kpi-value" style={{ color: "#c084fc" }}>{analytics.activeAlerts}</div>
                </div>
              </div>
            )}

            {/* EXECUTIVE REPORTS & EXPORT PANEL */}
            <section className="section-panel" style={{ borderLeft: "4px solid var(--accent-cyan)" }}>
              <div className="section-panel-header">
                <h2 className="section-panel-title">
                  <FileTextIcon size={18} /> Executive Reports & Compliance Export
                </h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "12.5px", padding: "6px 14px" }}
                    onClick={() => handleDownloadReport("excel")}
                  >
                    <DownloadIcon size={14} /> Export Excel (XLSX)
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "12.5px", padding: "6px 14px" }}
                    onClick={() => handleDownloadReport("pdf")}
                  >
                    <DownloadIcon size={14} /> Export PDF Report
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
                {[
                  { key: "SECURITY_REPORT", label: "Executive Security Report" },
                  { key: "PASSWORD_HEALTH", label: "Password Health Audit" },
                  { key: "AUDIT_REPORT", label: "System Compliance Trail" },
                  { key: "USER_ACTIVITY", label: "User & Device Activity" },
                  { key: "THREAT_MONITORING", label: "Threat Telemetry" },
                ].map((rep) => (
                  <button
                    key={rep.key}
                    type="button"
                    className={`btn ${selectedReportType === rep.key ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => {
                      setSelectedReportType(rep.key);
                      loadReportData(rep.key);
                    }}
                  >
                    {rep.label}
                  </button>
                ))}
              </div>

              {/* Report Summary Cards Preview */}
              {reportData && reportData.summaryMetrics && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    background: "var(--bg-surface-raised)",
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {Object.entries(reportData.summaryMetrics).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>{k}</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent-cyan)", marginTop: "2px" }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2FA / MFA Setup */}
            <section
              className="section-panel"
              style={{
                border: mfaEnabled
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid var(--border-medium)",
                background: mfaEnabled
                  ? "linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, var(--bg-surface) 100%)"
                  : "var(--bg-surface)",
              }}
            >
              <div
                className="section-panel-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <h2 className="section-panel-title">
                  <ShieldCheckIcon size={18} /> Two-Factor Authentication (MFA)
                </h2>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: mfaEnabled ? "rgba(16, 185, 129, 0.14)" : "rgba(245, 158, 11, 0.14)",
                    color: mfaEnabled ? "#10b981" : "#f59e0b",
                    border: mfaEnabled
                      ? "1px solid rgba(16, 185, 129, 0.35)"
                      : "1px solid rgba(245, 158, 11, 0.35)",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: mfaEnabled ? "#10b981" : "#f59e0b",
                      boxShadow: mfaEnabled ? "0 0 8px #10b981" : "none",
                    }}
                  />
                  {mfaEnabled ? "ACTIVE & ENFORCED" : "INACTIVE"}
                </span>
              </div>

              <p className="text-secondary" style={{ fontSize: "13.5px", marginBottom: "16px", lineHeight: "1.5" }}>
                {mfaEnabled
                  ? "Your vault is protected by production-grade Time-based One-Time Passwords (TOTP RFC 6238) and Email verification challenges. Every sign-in requires secondary verification."
                  : "Enforce multi-factor verification on every login using Google Authenticator, Microsoft Authenticator, Authy, or Email OTP to protect your credentials from unauthorized access."}
              </p>

              {mfaEnabled ? (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRegenerateBackupCodes}
                    disabled={mfaLoading}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <KeyIcon size={16} /> Regenerate Backup Codes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSetupMfa}
                    disabled={mfaLoading}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <SparklesIcon size={16} /> Reconfigure Authenticator App
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleDisableMfa}
                    disabled={mfaLoading}
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSetupMfa}
                  disabled={mfaLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <KeyIcon size={16} /> {mfaLoading ? "Generating Setup..." : "Setup Two-Factor Authentication (MFA)"}
                </button>
              )}
            </section>

            {/* Tracked Devices */}
            <section className="section-panel">
              <div className="section-panel-header">
                <h2 className="section-panel-title">
                  <LaptopIcon size={18} /> Recognized & Tracked Devices ({devices.length})
                </h2>
              </div>
              <div className="credential-grid">
                {devices.map((dev) => (
                  <div key={dev.id} className="credential-card">
                    <div>
                      <div className="card-top">
                        <div>
                          <h3 className="card-title-text">💻 {dev.browser} on {dev.os}</h3>
                          {dev.trusted && (
                            <span className="card-badge-enc">✓ Trusted Device</span>
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          IP Address: <strong className="mono-text">{dev.ipAddress}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Last Seen: {new Date(dev.lastSeen).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="card-footer-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12.5px" }}
                        onClick={() => handleToggleTrust(dev.id, dev.trusted)}
                      >
                        {dev.trusted ? "Untrust" : "Trust Device"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "6px 12px", fontSize: "12.5px" }}
                        onClick={() => handleRevokeDevice(dev.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Login Sessions */}
            <section className="section-panel">
              <div className="section-panel-header">
                <h2 className="section-panel-title">Active Login Sessions ({sessions.length})</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      background: "var(--bg-surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong>Session #{sess.id}</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        IP: <span className="mono-text">{sess.ipAddress}</span> | Created: {new Date(sess.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "6px 12px", fontSize: "12.5px" }}
                      onClick={() => handleRevokeSession(sess.id)}
                    >
                      Revoke Session
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Alerts */}
            <section className="section-panel">
              <div className="section-panel-header">
                <h2 className="section-panel-title">Security Alerts & Notifications ({notifications.length})</h2>
              </div>
              {notifications.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: "13.5px" }}>No active security alerts.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        background: n.readStatus ? "var(--bg-surface-raised)" : "var(--warning-bg)",
                        borderLeft: n.readStatus ? "4px solid var(--text-muted)" : "4px solid var(--warning)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{n.title}</strong>
                        {!n.readStatus && (
                          <button
                            type="button"
                            className="link-button"
                            style={{ fontSize: "12.5px" }}
                            onClick={() => handleMarkNotification(n.id)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: "13px", margin: "6px 0", color: "var(--text-secondary)" }}>{n.message}</p>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Audit Log Table */}
            <section className="section-panel">
              <div className="section-panel-header">
                <h2 className="section-panel-title">Audit Log & Event Telemetry ({securityEvents.length})</h2>
              </div>
              <div className="table-responsive">
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Risk Level</th>
                      <th>IP Address</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td className="mono-text" style={{ fontSize: "12.5px" }}>
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </td>
                        <td><strong>{ev.eventType}</strong></td>
                        <td>
                          <span
                            style={{
                              color: ev.status === "SUCCESS" ? "var(--success-text)" : "var(--danger-text)",
                              fontWeight: "700",
                              fontSize: "12px",
                            }}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "11px",
                              fontWeight: "700",
                              background:
                                ev.riskLevel === "LOW"
                                  ? "var(--success-bg)"
                                  : ev.riskLevel === "MEDIUM"
                                  ? "var(--warning-bg)"
                                  : "var(--danger-bg)",
                              color:
                                ev.riskLevel === "LOW"
                                  ? "var(--success-text)"
                                  : ev.riskLevel === "MEDIUM"
                                  ? "var(--warning-text)"
                                  : "var(--danger-text)",
                            }}
                          >
                            {ev.riskLevel}
                          </span>
                        </td>
                        <td className="mono-text" style={{ fontSize: "12.5px" }}>{ev.ipAddress}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{ev.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            TAB 4: ADMIN CONSOLE (RBAC)
           ========================================================= */}
        {activeTab === "admin" && userRole === "ADMINISTRATOR" && (
          <div>
            <div className="vault-header-bar">
              <div className="vault-header-title-group">
                <h1>Admin Console & RBAC Policy</h1>
                <p>Manage system users, tenant roles, and platform health telemetry.</p>
              </div>
            </div>

            {adminStats && (
              <div className="analytics-grid" style={{ marginBottom: "28px" }}>
                <div className="kpi-card">
                  <div className="kpi-title">Total Registered Users</div>
                  <div className="kpi-value">{adminStats.totalUsers}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Total Encrypted Credentials</div>
                  <div className="kpi-value">{adminStats.totalCredentials}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-title">Total Security Events</div>
                  <div className="kpi-value">{adminStats.totalSecurityEvents}</div>
                </div>
              </div>
            )}

            <section className="section-panel">
              <div className="section-panel-header">
                <h2 className="section-panel-title">Role-Based Access Control (RBAC)</h2>
              </div>
              <div className="table-responsive">
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Update Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="mono-text">#{u.id}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={`role-badge ${u.role === "ADMINISTRATOR" ? "admin" : ""}`}
                            style={{ fontSize: "12px", padding: "2px 8px", background: "var(--bg-surface-raised)", borderRadius: "4px" }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <select
                            className="input-field"
                            style={{ padding: "6px 10px", fontSize: "13px", width: "auto" }}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          >
                            <option value="USER">USER</option>
                            <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* =========================================================
          ADD / EDIT CREDENTIAL MODAL
         ========================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? (isSharedEdit ? "Edit Shared Credential" : "Edit Encrypted Item") : "Add Secure Item to Vault"}
      >
        <form onSubmit={handleVaultSubmit}>
          <div className="form-group">
            <label className="form-label">Item Type</label>
            <select
              className="input-field"
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
            >
              <option value="LOGIN">Login Password</option>
              <option value="SECURE_NOTE">Secure Note</option>
              <option value="API_KEY">API Key / Token</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Service / Item Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. GitHub, AWS Console, Netflix, Master Key"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {credentialType !== "SECURE_NOTE" && (
            <div className="form-group">
              <label className="form-label">Username / Identity / Email</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. user@example.com or root"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          {credentialType !== "SECURE_NOTE" && (
            <div className="form-group">
              <div className="form-label">
                <span>Secret / Password</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={handleGeneratePassword}
                  style={{ fontSize: "12px" }}
                >
                  <SparklesIcon size={14} /> Generate Strong
                </button>
              </div>

              <div className="input-wrapper">
                <input
                  type={showModalPassword ? "text" : "password"}
                  className="input-field mono-text"
                  placeholder="Enter secret password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <div className="input-action-right">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showModalPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {strengthInfo && (
                <div className="generator-box">
                  <div className="strength-meter-header">
                    <span>Strength: <strong>{strengthInfo.score}</strong></span>
                    <span>{strengthInfo.scorePercentage}%</span>
                  </div>
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${strengthInfo.scorePercentage}%`,
                        backgroundColor:
                          strengthInfo.score === "WEAK"
                            ? "var(--danger)"
                            : strengthInfo.score === "MEDIUM"
                            ? "var(--warning)"
                            : "var(--success)",
                      }}
                    />
                  </div>
                  {strengthInfo.suggestions?.length > 0 && (
                    <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      💡 {strengthInfo.suggestions.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Generator Rules Accordion */}
              <details className="gen-options-details">
                <summary>⚙️ Customize Generator Options (Length: {genLength})</summary>
                <div className="gen-options-grid">
                  <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                    <span>Length: <strong>{genLength}</strong></span>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={genLength}
                      onChange={(e) => setGenLength(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} />
                    Uppercase (A-Z)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} />
                    Lowercase (a-z)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <input type="checkbox" checked={useDigits} onChange={(e) => setUseDigits(e.target.checked)} />
                    Numbers (0-9)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} />
                    Symbols (!@#$)
                  </label>
                </div>
              </details>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Website URL (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://github.com/login"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Encrypted Notes & Extra Metadata</label>
            <textarea
              className="input-field mono-text"
              rows={3}
              placeholder="Recovery codes, server SSH keys, or extra secret notes (AES-256 encrypted)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
            />
            <span>Mark as Favorite (Starred item)</span>
          </label>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? "Update Item" : "Save Encrypted Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={Boolean(mfaSetupData)}
        onClose={() => setMfaSetupData(null)}
        title="Setup Two-Factor Authentication (TOTP)"
        maxWidth="540px"
      >
        {mfaSetupData && (
          <form onSubmit={handleEnableMfa} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong> on your phone.
            </div>

            {/* QR Code Container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                background: "var(--bg-surface-raised, rgba(255, 255, 255, 0.03))",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  display: "inline-block",
                }}
              >
                <img
                  src={mfaSetupData.qrCode}
                  alt="TOTP QR Code"
                  style={{ width: "200px", height: "200px", display: "block" }}
                />
              </div>

              <div style={{ width: "100%", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Can't scan? Enter secret key manually into your app:
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "6px",
                  }}
                >
                  <code
                    className="mono-text"
                    style={{
                      padding: "6px 12px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      letterSpacing: "0.08em",
                      fontWeight: "600",
                      color: "var(--primary-color)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {mfaSetupData.formattedKey || mfaSetupData.secretKey}
                  </code>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => copyMfaToClipboard(mfaSetupData.secretKey, "key")}
                    style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copiedKey ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    {copiedKey ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: "600" }}>
                Enter the 6-digit code shown in your Authenticator app
              </label>
              <input
                type="text"
                className="input-field mono-text"
                placeholder="000000"
                maxLength="6"
                value={mfaVerifyCode}
                onChange={(e) => setMfaVerifyCode(e.target.value)}
                style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: "18px", fontWeight: "700" }}
                required
                autoFocus
              />
            </div>

            <div className="modal-footer" style={{ marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMfaSetupData(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mfaLoading || mfaVerifyCode.trim().length !== 6}
              >
                {mfaLoading ? "Verifying..." : "Confirm & Activate 2FA"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Backup Recovery Codes Modal */}
      <Modal
        isOpen={Boolean(backupCodesModal)}
        onClose={() => setBackupCodesModal(null)}
        title="MFA Recovery Codes"
        maxWidth="500px"
      >
        {backupCodesModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "var(--warning-text, #f59e0b)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12.5px",
                lineHeight: "1.45",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <AlertIcon size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Save these single-use recovery codes in a secure location.</strong>
                <p style={{ marginTop: "4px", fontSize: "12px" }}>
                  If you ever lose access to your phone or authenticator app, each code can be used once as your sign-in verification code.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "16px",
                background: "var(--bg-surface-raised, rgba(0,0,0,0.2))",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {backupCodesModal.map((code, idx) => (
                <div
                  key={idx}
                  className="mono-text"
                  style={{
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "6px",
                    textAlign: "center",
                    fontWeight: "600",
                    letterSpacing: "0.08em",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                  }}
                >
                  {code}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => copyMfaToClipboard(backupCodesModal.join("\n"), "backup")}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {copiedBackup ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                {copiedBackup ? "All Codes Copied!" : "Copy All Codes"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setBackupCodesModal(null)}
              >
                I Have Saved My Codes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Vault;