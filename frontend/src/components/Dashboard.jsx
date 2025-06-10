import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  HomeOutlined,
  LineChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Menu,
  Button,
  theme,
  Card,
  Statistic,
  Table,
  DatePicker,
  Select,
  Divider,
  Form,
  Input,
  Modal,
  message,
  Row,
  Col,
  Tabs,
  Space,
  Popconfirm,
  Radio,
  List
} from "antd";


const { Header: AntHeader, Sider, Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
import api from "../api/axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const subdivisionIndicators = {
  DGIEO: [
    "Servicii prestate populatiei",
    "Servicii prestate autoritatilor consulare/internationale",
    "Eliberarea informatiei din RICC si RSC",
    "Caziere judiciare eliberate",
    "Caziere judiciare detaliate eliberate",
    "Caziere contraventionale eliberate",
    "Prelucrate înștiintari de cautare a persoanelor (ZIMBRA)",
    "Activitati dactiloscopice",
    "Activitati arhivistice",
  ],
  DGTIC: [
    "Interventii comunicatii speciale TETRA",
    "Interventii infrastructura retea/echipamente",
    "Adrese IP acordate",
    "Cereri ServiceDesk solutionate",
    "Instalari software specializat",
  ],
  DMSS: [
    "Incalcari validate circulatie rutiera",
    "Procese-verbale expediate",
    "Monitorizare plati contraventii inregistrate",
    "Interventii la posturi de supraveghere",
    "Numar de scrisori recomandate imprimate si expediate",
    "Numar de procese-verbale imprimate",
  ],
  DDEG: [
    "Incidente retea mobila solutionate",
    "Administrare pagini web",
    "Administrare si gestionarea utilizatorilor la SI externe",
  ],
  DSPI: [
    "Dosare gestionate arhiva MAI",
    "Cartele acces procesate",
    "Verificati candidati angajare",
  ],
  SJ: [
    "Proiecte acte administrative interne elaborate",
    "Proiecte acte administrative interne avizate",
    "Proiecte acte administrative avizate",
    "Contracte avizate",
    "Participare in sedinta de judecata",
  ],
  SMO: [
    "Note informative elaborate",
    "Elaborare Proces-verbal reuniuni de lucru",
  ],
  SAI: ["Interventii la reteaua electrica"],
  SLAP: ["Interventii la reteaua electrica numar	suma"],
  SS: [
    "Documente inregistrate (intrare)",
    "Documente expediate (iesire)",
    "Număr de petitii înregistrate",
    "Număr de petitii în examinare",
    "Număr de petitii soluționate",
    "Scanarea codului de bare de pe cazierele destinate livrarii prin intermediul M-Delivery",
  ],
  SRU: [
    "Numar dosare personale gestionate",
    "Ordine personal elaborate",
    "Ordine cursuri de instruire",
    "Cereri concedii procesate",
    "Perfectarea extraselor de ordin",
  ],
};

// Static subdivisions list with names mapped to IDs
const subdivisionData = {
  DGIEO: { id: 1, name: "DGIEO" },
  DGTIC: { id: 2, name: "DGTIC" },
  DMSS: { id: 3, name: "DMSS" },
  DDEG: { id: 4, name: "DDEG" },
  DSPI: { id: 5, name: "DSPI" },
  SJ: { id: 6, name: "SJ" },
  SMO: { id: 7, name: "SMO" },
  SAI: { id: 8, name: "SAI" },
  SLAP: { id: 9, name: "SLAP" },
  SS: { id: 10, name: "SS" },
  SRU: { id: 11, name: "SRU" },
};

// Helper function to get subdivision name by ID
const getSubdivisionName = (id) => {
  const subdivision = Object.values(subdivisionData).find(
    (sub) => sub.id === id
  );
  return subdivision ? subdivision.name : id; // Return ID if not found (fallback)
};

const handleDownload = async (fileName) => {
  if (!fileName) {
    console.error("Numele fișierului este invalid!");
    message.error("Numele fișierului este invalid!");
    return;
  }



  try {
    const response = await api.get(
      `/reports/download/${encodeURIComponent(fileName)}`,
      {
        responseType: "blob", // Necesar pentru fișiere binare (PDF, Excel, CSV)
      }
    );

    // Creează un link temporar pentru descărcare
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName); // Setează numele fișierului
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success("Fișier descărcat cu succes!");
  } catch (error) {
    console.error("Eroare la descărcare:", error);
    if (error.response?.status === 401) {
      message.error("Autentificare necesară. Redirecționare către login...");
    } else if (error.response?.status === 404) {
      message.error("Fișierul nu a fost găsit");
    } else {
      message.error("Eroare la descărcarea fișierului");
    }
  }
};

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubdivision, setSelectedSubdivision] = useState("all");
  const [dateRange, setDateRange] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [indicators, setIndicators] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // Track which indicator is being edited
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [reportSubdivision, setReportSubdivision] = useState("all");
  const [indicatorMode, setIndicatorMode] = useState("select"); // 'select' or 'custom'
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const [userRoleFilter, setUserRoleFilter] = useState("all");
const [userStatusFilter, setUserStatusFilter] = useState("all");
const [userSearch, setUserSearch] = useState("");
const [activities, setActivities] = useState([]);
const [newActivity, setNewActivity] = useState('');
const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);


const handleAddActivity = () => {
  if (newActivity.trim()) {
    setActivities([...activities, newActivity]);
    setNewActivity('');
  }
};

const filteredUsers = users.filter((user) => {
  const matchesRole =
    userRoleFilter === "all" || user.role === userRoleFilter;
  const matchesStatus =
    userStatusFilter === "all" || user.status === userStatusFilter;
  const matchesSearch =
    user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase());
  return matchesRole && matchesStatus && matchesSearch;
});

const deleteUser = async (id) => {
  try {
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    message.success("Utilizator șters cu succes!");
  } catch (err) {
    message.error("Eroare la ștergerea utilizatorului");
  }
};

const generateAllReports = async () => {
  try {
    setIsActivityModalVisible(true); // Deschide modalul și pentru rapoartele multiple
  } catch (error) {
    console.error("Eroare:", error);
  }
};

const confirmGenerateAllReports = async () => {
  try {
    setLoading(true);
    const response = await api.post("/reports/all", {
      periodType: reportPeriod,
      activities: activities // Trimite activitățile către backend
    });
    
    const report = {
      key: Date.now(),
      title: `Raport ${reportPeriod} - Toate subdiviziunile`,
      date: new Date().toISOString(),
      downloadUrls: response.data.downloadUrls,
      activities: activities // Salvează activitățile în starea locală
    };

    setReports((prev) => [report, ...prev]);
    setIsActivityModalVisible(false);
    setActivities([]);
  } catch (error) {
    console.error("Eroare la generarea rapoartelor multiple:", error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (!authLoading && activeTab === "admin" && currentUser?.role !== "admin") {
      navigate("/");
      message.error("Nu aveți permisiuni de administrator!");
    }
  }, [authLoading, activeTab, currentUser, navigate]);

  if (authLoading) {
    return <div>Încărcare...</div>;
  }

  const periodMapping = {
    weekly: "săptămânal",
    quarterly: "trimestrial",
    annual: "anual",
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleProfileClick = async () => {
  try {
    if (currentUser) {
      setUserProfile(currentUser);
      setIsProfileModalOpen(true);
      return;
    }
    setLoading(true);
    const response = await api.get("/auth/me");
    setUserProfile(response.data);
    setIsProfileModalOpen(true);
  } catch (error) {
    message.error("Eroare la încărcarea datelor profilului");
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      message.success("Deconectare realizată cu succes!");
      navigate("/login");
    } catch (error) {
      message.error("Eroare la deconectare");
    } finally {
      setLoading(false);
    }
  };

  // Load indicators on mount
  useEffect(() => {
    const fetchIndicators = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/indicators");

        if (response.status >= 200 && response.status < 300) {
          if (Array.isArray(response.data.data)) {
            setIndicators(response.data.data);
          } else {
            console.error("Date neașteptate:", response.data);
            setError("Format invalid al datelor primite");
          }
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (err) {
        console.error("Eroare API:", err);
        setError("Eroare la încărcarea datelor");
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/reports");

        if (response.status >= 200 && response.status < 300) {
          if (Array.isArray(response.data)) {
            const formattedReports = response.data.map((report) => {
              // Extrage tipul de raport (weekly, quarterly, annual) din titlu
              const periodMatch = report.title.match(
                /(weekly|quarterly|annual)/i
              );
              const period = periodMatch ? periodMatch[0].toLowerCase() : "";
              // Înlocuiește termenul în engleză cu cel în română
              const translatedTitle = period
                ? report.title.replace(period, periodMapping[period])
                : report.title;

              return {
                id: report.id,
                title: translatedTitle,
                date: report.period_end,
                key: `report-${report.id}`,
                fileName: JSON.parse(report.file_path).pdf,
                downloadUrls: JSON.parse(report.file_path),
              };
            });
            setReports(formattedReports);
          } else {
            console.error("Date neașteptate:", response.data);
            setError("Format invalid al datelor primite");
          }
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (err) {
        console.error("Eroare API:", err);
        setError("Eroare la încărcarea rapoartelor");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

const fetchIndicatorRecords = async () => {
  setLoading(true);
  setError(null);

  try {
    const indicatorsResponse = await api.get("/indicators");
    const indicatorsMap = {};
    if (Array.isArray(indicatorsResponse.data.data)) {
      indicatorsResponse.data.data.forEach((indicator) => {
        indicatorsMap[indicator.id] = indicator.name;
      });
      setIndicators(indicatorsResponse.data.data); // Actualizăm lista de indicatori
    }

    const response = await api.get("/indicator-records");
    if (response.status >= 200 && response.status < 300) {
      if (Array.isArray(response.data.data)) {
        let data = response.data.data.map((item) => ({
          key: item.id,
          subdiviziune: item.subdivision_id
            ? getSubdivisionName(item.subdivision_id)
            : item.indicator?.subdivision_id
            ? getSubdivisionName(item.indicator.subdivision_id)
            : "-",
          subdiviziuneId:
            item.subdivision_id || item.indicator?.subdivision_id || null,
          indicator:
            indicatorsMap[item.indicator_id] ||
            item.indicator?.name ||
            `Indicator ${item.indicator_id}` ||
            "-",
          valoare: item.value || 0,
          data: item.record_date ? item.record_date.slice(0, 10) : "-",
          utilizator: item.user_id || "-",
        }));

        // Aplicăm filtrele
        if (selectedSubdivision !== "all") {
          const subdivisionId = subdivisionData[selectedSubdivision]?.id;
          data = data.filter((d) => d.subdiviziuneId === subdivisionId);
        }

        if (dateRange.length === 2) {
          data = data.filter((d) => {
            const date = new Date(d.data);
            return date >= dateRange[0] && date <= dateRange[1];
          });
        }

        data = data.sort((a, b) => new Date(b.data) - new Date(a.data));
        setFilteredData(data);
      } else {
        throw new Error("Format invalid al datelor primite");
      }
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (err) {
    console.error("Eroare API:", err);
    message.error("Eroare la încărcarea înregistrărilor");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchIndicatorRecords();
}, [selectedSubdivision, dateRange, refreshTrigger]);

 


// Modificăm handleSubmitIndicator
const handleSubmitIndicator = async (values) => {
  try {
    if (!values.subdivision || !subdivisionData[values.subdivision]) {
      message.error("Subdiviziunea selectată nu este validă!");
      return;
    }
    const subdivisionId = subdivisionData[values.subdivision].id;

    let indicatorNameToSend;
    if (indicatorMode === "select") {
      indicatorNameToSend = values.selectedIndicator;
    } else {
      indicatorNameToSend = values.customIndicator;
    }

    if (!indicatorNameToSend) {
      message.error("Numele indicatorului este obligatoriu!");
      return;
    }

    let indicatorId = editingId;

    // Salvează sau actualizează indicatorul
    if (editingId) {
      const response = await api.put(`/indicators/${editingId}`, {
        name: indicatorNameToSend,
        subdivision_id: subdivisionId,
        measurement_unit: values.unit || "",
        aggregation_type: values.type || "",
        description: values.description || "",
      });
      message.success("Indicator actualizat cu succes!");
    } else {
      const response = await api.post("/indicators", {
        name: indicatorNameToSend,
        subdivision_id: subdivisionId,
        measurement_unit: values.unit || "",
        aggregation_type: values.type || "",
        description: values.description || "",
      });

      let newIndicator;
      if (response.data.indicator) {
        newIndicator = response.data.indicator;
      } else if (response.data.data) {
        newIndicator = response.data.data;
      } else if (response.data.id) {
        newIndicator = response.data;
      } else {
        throw new Error("Răspuns API invalid: indicatorul nu a fost găsit.");
      }

      if (!newIndicator.id) {
        throw new Error("ID-ul indicatorului lipsește în răspuns.");
      }

      indicatorId = newIndicator.id;
      message.success("Indicator salvat cu succes!");
    }

    // Salvează sau actualizează înregistrarea în indicator_records
    if (values.value && values.recordDate) {
      if (!Number.isFinite(Number(values.value))) {
        message.error("Valoarea trebuie să fie un număr valid!");
        return;
      }

      const recordDate = values.recordDate ? moment(values.recordDate) : null;
      if (!recordDate || !recordDate.isValid()) {
        message.error("Data introdusă nu este validă!");
        return;
      }

      if (editingRecordId) {
        try {
          const checkResponse = await api.get(`/indicator-records?indicator_id=${indicatorId}`);
          const recordExists = checkResponse.data.data.some(
            (record) => record.id === editingRecordId
          );
          if (!recordExists) {
            console.warn("Înregistrarea cu ID-ul", editingRecordId, "nu există. Se va crea o nouă înregistrare.");
            setEditingRecordId(null);
          }
        } catch (err) {
          console.error("Eroare la verificarea înregistrării:", err);
          message.error("Eroare la verificarea existenței înregistrării!");
          return;
        }
      }

      if (editingRecordId) {
        const recordResponse = await api.put(`/indicator-records/${editingRecordId}`, {
          indicator_id: indicatorId,
          value: Number(values.value),
          record_date: recordDate.format("YYYY-MM-DD"),
          notes: values.notes || null,
        });

        if (!recordResponse.data || !recordResponse.data.data) {
          console.error("Răspuns API invalid pentru actualizarea înregistrării:", recordResponse.data);
          message.error("Răspuns invalid de la server la actualizarea înregistrării.");
          return;
        }

        message.success("Înregistrare actualizată cu succes!");
      } else {
        const recordResponse = await api.post("/indicator-records", {
          indicator_id: indicatorId,
          value: Number(values.value),
          record_date: recordDate.format("YYYY-MM-DD"),
          notes: values.notes || null,
        });

        if (!recordResponse.data || !recordResponse.data.data) {
          console.error("Răspuns API invalid pentru înregistrare:", recordResponse.data);
          message.error("Răspuns invalid de la server la crearea înregistrării.");
          return;
        }

        message.success("Înregistrare salvată cu succes!");
      }
    } else if (!editingId) {
      message.error("Valoarea și data sunt obligatorii pentru o nouă înregistrare!");
      return;
    }

    // Reîmprospătăm datele
    setRefreshTrigger((prev) => prev + 1); // Declanșăm reîncărcarea datelor
    form.resetFields();
    setIsModalOpen(false);
    setEditingId(null);
    setEditingRecordId(null);
    setIndicatorMode("select");
  } catch (err) {
    console.error("Eroare detaliată:", err.response?.data || err);
    if (err.response?.status === 409) {
      message.error(err.response.data?.message || "Indicatorul există deja pentru această subdiviziune!");
    } else if (err.response?.status === 500) {
      message.error(`Eroare server: ${err.response.data?.error || "Eroare internă la actualizarea înregistrării."}`);
    } else {
      message.error(err.response?.data?.error || "A apărut o eroare la salvarea indicatorului sau înregistrării.");
    }
  }
};
  // Handle edit button click
  const handleEdit = async (record) => {
 

  // Verifică dacă record este valid
  if (!record || !record.id) {
    message.error("Datele indicatorului sunt invalide!");
    return;
  }

  // Găsește subdiviziunea asociată indicatorului
  const subdivisionName = Object.keys(subdivisionData).find(
    (key) => subdivisionData[key].id === record.subdivision_id
  );

  if (!subdivisionName) {
    message.error("Subdiviziunea nu a fost găsită!");
    return;
  }

  // Setează câmpurile formularului pentru indicator
  form.setFieldsValue({
    subdivision: subdivisionName,
    unit: record.measurement_unit || "",
    type: record.aggregation_type || "",
    description: record.description || "",
    indicatorMode: subdivisionIndicators[subdivisionName]?.includes(String(record.name || ""))
      ? "select"
      : "custom",
    selectedIndicator: subdivisionIndicators[subdivisionName]?.includes(record.name)
      ? record.name
      : undefined,
    customIndicator: subdivisionIndicators[subdivisionName]?.includes(record.name)
      ? undefined
      : record.name,
  });

  try {
    // Obține înregistrările asociate indicatorului
    const response = await api.get(`/indicator-records?indicator_id=${record.id}`);
   

    // Verifică dacă răspunsul API este valid
    if (!response.data || !Array.isArray(response.data.data)) {
      console.error("Răspuns API invalid:", response.data);
      message.error("Eroare la preluarea înregistrărilor: format invalid!");
      form.setFieldsValue({
        value: undefined,
        recordDate: undefined,
        notes: undefined,
      });
      setEditingRecordId(null);
      return;
    }

    

    const records = response.data.data;
    console.log("IDs disponibile:", records.map((r) => r.id));

    if (records.length > 0) {
      // Sortează înregistrările după dată (cea mai recentă)
      const latestRecord = records.sort(
        (a, b) => new Date(b.record_date) - new Date(a.record_date)
      )[0];
      console.log("Latest record:", latestRecord);

      if (!latestRecord.id) {
        console.error("Eroare: latestRecord nu are ID valid:", latestRecord);
        message.error("Înregistrarea selectată nu are un ID valid.");
        form.setFieldsValue({
          value: undefined,
          recordDate: undefined,
          notes: undefined,
        });
        setEditingRecordId(null);
      } else {
        // Setează câmpurile formularului pentru înregistrare
        form.setFieldsValue({
          value: latestRecord.value,
          recordDate: latestRecord.record_date ? moment(latestRecord.record_date) : null,
          notes: latestRecord.notes || undefined,
        });
        setEditingRecordId(latestRecord.id);
        console.log("editingRecordId setat:", latestRecord.id);
      }
    } else {
      console.warn("Nicio înregistrare găsită pentru indicator_id:", record.id);
      message.info("Nicio înregistrare găsită. Puteți adăuga o nouă înregistrare.");
      form.setFieldsValue({
        value: undefined,
        recordDate: undefined,
        notes: undefined,
      });
      setEditingRecordId(null);
    }

    setIndicatorMode(
      subdivisionIndicators[subdivisionName]?.includes(record.name) ? "select" : "custom"
    );
    setEditingId(record.id);
    setIsModalOpen(true);
  } catch (err) {
    console.error("Eroare la preluarea înregistrării:", err);
    message.error("Eroare la preluarea datelor înregistrării");
    form.setFieldsValue({
      value: undefined,
      recordDate: undefined,
      notes: undefined,
    });
    setEditingRecordId(null);
    setIsModalOpen(true); // Deschide modalul chiar și în caz de eroare pentru a permite editarea manuală
  }
};
  // Handle delete indicator
  const handleDelete = async (id) => {
    try {
      await api.delete(`/indicators/${id}`);
      message.success("Indicator șters cu succes!");
      setIndicators((prev) => prev.filter((item) => item.id !== id));
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting indicator:", err);
      message.error("Eroare la ștergerea indicatorului");
    }
  };

  // Generate dummy report
  const generateReport = async () => {
  try {
    if (reportSubdivision === "all") {
      message.error("Selectați o subdiviziune pentru raport!");
      return;
    }

    setIsActivityModalVisible(true); // Deschide modalul pentru activități
  } catch (err) {
    console.error("Eroare:", err);
    message.error("Eroare la pregătirea raportului");
  }
};

const confirmGenerateReport = async () => {
  try {
    setLoading(true);
    const subdivisionId = subdivisionData[reportSubdivision].id;

    const endpoint = `/reports/${reportPeriod}`;

    const response = await api.post(endpoint, {
      subdivision_id: subdivisionId,
      activities: activities // Trimite activitățile către backend
    });

    const newReport = {
      id: response.data.id || Date.now(),
      title: `Raport ${periodMapping[reportPeriod]} - ${reportSubdivision}`,
      date: new Date().toISOString(),
      key: `report-${Date.now()}`,
      fileName: response.data.downloadUrls.pdf,
      downloadUrls: response.data.downloadUrls,
      activities: activities // Salvează activitățile în starea locală
    };

    setReports((prev) => [newReport, ...prev]);
    message.success("Raport generat cu succes!");
    setIsActivityModalVisible(false);
    setActivities([]);
  } catch (err) {
    console.error("Eroare generare raport:", err);
    message.error("Eroare la generarea raportului");
  } finally {
    setLoading(false);
  }
};

  const filteredReports = reports.filter((report) => {
    if (reportSubdivision === "all") return true;

    // Extrage numele subdiviziunii din titlul raportului
    const subdivisionInTitle = Object.keys(subdivisionData).find((sub) =>
      report.title.includes(sub)
    );

    return subdivisionInTitle === reportSubdivision;
  });

  // Table columns
  const columns = [
    { title: "Subdiviziune", dataIndex: "subdiviziune", key: "subdiviziune" },
    { title: "Indicator", dataIndex: "indicator", key: "indicator" },
    { title: "Valoare", dataIndex: "valoare", key: "valoare" },
    { title: "Data", dataIndex: "data", key: "data" },
    { title: "Utilizator", dataIndex: "utilizator", key: "utilizator" },
    {
      title: "Acțiuni",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            key="edit"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            key="delete"
            title="Sigur doriți să ștergeți acest indicator?"
            onConfirm={() => handleDelete(record.id)}
            okText="Da"
            cancelText="Nu"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Overview stats
  const statTotal = Object.keys(subdivisionData).length;
  const statMonitor = indicators.length;
  const statComplete = filteredData.length;
  const statReports = reports.length;

  // Configurare Tabs pentru secțiunea de administrare
  const adminTabsItems = [
    {
      key: "users",
      label: "Utilizatori",
      children: (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3>Gestionare utilizatori</h3>
             <Space>
          <Select
            value={userRoleFilter}
            style={{ width: 140 }}
            onChange={setUserRoleFilter}
            placeholder="Filtru rol"
            allowClear
          >
            <Option value="all">Toate rolurile</Option>
            <Option value="admin">Admin</Option>
            <Option value="user">User</Option>
            {/* Adaugă alte roluri dacă există */}
          </Select>
          <Select
            value={userStatusFilter}
            style={{ width: 140 }}
            onChange={setUserStatusFilter}
            placeholder="Filtru status"
            allowClear
          >
            <Option value="all">Toate statusurile</Option>
            <Option value="active">Activ</Option>
            <Option value="inactive">Inactiv</Option>
            {/* Adaugă alte statusuri dacă există */}
          </Select>
          <Input.Search
            placeholder="Caută nume/email"
            allowClear
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            style={{ width: 200 }}
          />
        </Space>
          </div>
          <Table
            columns={[
              { title: "Nume", dataIndex: "name", key: "name" },
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Rol", dataIndex: "role", key: "role" },
              {
                title: "Acțiuni",
                key: "actions",
                render: (_, rec) => (
                  <Popconfirm
                    title="Șterge?"
                    onConfirm={() => deleteUser(rec.id)}
                  >
                    <Button icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                ),
              },
            ]}
            dataSource={users}
            rowKey="id"
          />
        </>
      ),
    },
    {
      key: "settings",
      label: "Settings",
      children: <Card title="Configurare sistem">{/* ... */}</Card>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} trigger={null}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/sti_logo.png"
            alt="logo"
            style={{ height: collapsed ? 30 : 40 }}
          />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            {
              key: "1",
              icon: <HomeOutlined />,
              label: "Panou general",
              onClick: () => setActiveTab("overview"),
            },
            {
              key: "2",
              icon: <LineChartOutlined />,
              label: "Indicatori",
              onClick: () => setActiveTab("indicators"),
            },
            {
              key: "3",
              icon: <FileTextOutlined />,
              label: "Rapoarte",
              onClick: () => setActiveTab("reports"),
            },
            {
              key: "4",
              icon: <SettingOutlined />,
              label: "Administrare",
              onClick: () => setActiveTab("admin"),
            },
          ]}
        />
      </Sider>
      <Layout>
        <AntHeader style={{ background: colorBgContainer, padding: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 16px",
            }}
          >
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            />
            <div style={{ display: "flex", gap: 16 }}>
              <Select
                value={selectedSubdivision}
                style={{ width: 200 }}
                onChange={setSelectedSubdivision}
              >
                <Option value="all">Toate subdiviziunile</Option>
                {Object.keys(subdivisionData).map((s) => (
                  <Option key={`subdiv-${s}`} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
              <RangePicker onChange={(dates) => setDateRange(dates || [])} />
              <Button
                icon={<UserOutlined />}
                onClick={handleProfileClick}
                loading={loading}
              >
                Profil
              </Button>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                loading={loading}
              >
                Deconectare
              </Button>
            </div>
          </div>
        </AntHeader>
        <Content
          style={{
            margin: "24px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Modal
            title="Profil utilizator"
            open={isProfileModalOpen}
            onCancel={() => setIsProfileModalOpen(false)}
            footer={[
              <Button key="close" onClick={() => setIsProfileModalOpen(false)}>
                Închide
              </Button>,
            ]}
          >
            {userProfile ? (
              <div>
                <p>
                  <strong>Nume:</strong> {userProfile.username || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {userProfile.email || "-"}
                </p>
                <p>
                  <strong>Rol/Tip:</strong>{" "}
                  {userProfile.type || userProfile.role || "-"}
                </p>
              </div>
            ) : (
              <p>Nu există date disponibile.</p>
            )}
          </Modal>

          {activeTab === "overview" && (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic title="Total subdiviziuni" value={statTotal} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Indicatori monitorizați"
                      value={statMonitor}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Completări săptămâna curentă"
                      value={statComplete}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="Rapoarte generate" value={statReports} />
                  </Card>
                </Col>
              </Row>

              {/* Adaugăm secțiunea cu grafice */}
              <Divider>Vizualizări grafice</Divider>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                {/* Grafic 1: Bar chart - Indicatori pe subdiviziuni */}
                <Col span={12}>
                  <Card title="Indicatori pe subdiviziuni">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(
                          filteredData.reduce((acc, item) => {
                            acc[item.subdiviziune] =
                              (acc[item.subdiviziune] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([name, count]) => ({ name, count }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          fill="#7A8B99"
                          name="Număr indicatoare"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>

                {/* Grafic 2: Pie chart - Distribuție pe subdiviziuni */}
                <Col span={12}>
                  <Card title="Distribuție pe subdiviziuni">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            filteredData.reduce((acc, item) => {
                              acc[item.subdiviziune] =
                                (acc[item.subdiviziune] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#1D4CA0"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {Object.keys(subdivisionData).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#2E4057",
                                  "#4A6275",
                                  "#6D8299",
                                  "#8B9BA3",
                                  "#3A4F66",
                                  "#5C6B7A",
                                  "#405B6F",
                                  "#7B8A99",
                                ][index % 6]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              {/* Grafic 3: Line chart - Evoluție temporală */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Card title="Evoluție temporală a completărilor">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={Object.entries(
                          filteredData.reduce((acc, item) => {
                            acc[item.data] = (acc[item.data] || 0) + 1;
                            return acc;
                          }, {})
                        )
                          .map(([date, count]) => ({ date, count }))
                          .sort((a, b) => new Date(a.date) - new Date(b.date))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#5A6B7A"
                          name="Număr completări"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              <Divider>Ultimele completări</Divider>
              <Table
                columns={columns.filter((col) => col.key !== "actions")}
                dataSource={filteredData}
                pagination={{ pageSize: 5 }}
                rowKey="key"
                loading={loading}
              />
            </>
          )}

          {activeTab === "indicators" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h2>Indicatori de activitate</h2>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    form.resetFields();
                    setEditingId(null);
                    setIndicatorMode("select");
                    setIsModalOpen(true);
                  }}
                >
                  Adaugă indicator
                </Button>
              </div>

              <Table
                columns={[
                  { title: "Nume", dataIndex: "name", key: "name" },
                  {
                    title: "Subdiviziune",
                    dataIndex: "subdivision_id",
                    key: "subdivision",
                    render: (id) => getSubdivisionName(id),
                  },
                  {
                    title: "Unitate",
                    dataIndex: "measurement_unit",
                    key: "unit",
                  },
                  {
                    title: "Agregare",
                    dataIndex: "aggregation_type",
                    key: "aggregation",
                  },
                  {
                    title: "Acțiuni",
                    key: "actions",
                    render: (_, record) => (
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(record)}
                        />
                        <Popconfirm
                          title="Sigur doriți să ștergeți acest indicator?"
                          onConfirm={() => handleDelete(record.id)}
                          okText="Da"
                          cancelText="Nu"
                        >
                          <Button icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                dataSource={
                  selectedSubdivision === "all"
                    ? indicators
                    : indicators.filter(
                        (ind) =>
                          ind.subdivision_id ===
                          subdivisionData[selectedSubdivision]?.id
                      )
                }
                rowKey="id"
                pagination={false}
                loading={loading}
              />

              <Modal
                title={
                  editingId
                    ? "Editează indicator și adaugă înregistrare"
                    : "Adaugă indicator și înregistrare"
                }
                open={isModalOpen}
                footer={null}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  form.resetFields();
                  setIndicatorMode("select");
                }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmitIndicator}
                  initialValues={{ indicatorMode: "select" }}
                >
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="subdivision"
                        label="Subdiviziune"
                        rules={[
                          {
                            required: true,
                            message: "Selectați o subdiviziune",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Selectează subdiviziunea"
                          onChange={(value) => {
                            form.setFieldsValue({
                              selectedIndicator: undefined,
                              customIndicator: undefined,
                            });
                          }}
                        >
                          {Object.keys(subdivisionData).map((s) => (
                            <Option key={`subdiv-${s}`} value={s}>
                              {s}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Tip indicator">
                        <Radio.Group
                          onChange={(e) => {
                            setIndicatorMode(e.target.value);
                            form.setFieldsValue({
                              selectedIndicator: undefined,
                              customIndicator: undefined,
                            });
                          }}
                          value={indicatorMode}
                        >
                          <Radio value="select">Selectează din listă</Radio>
                          <Radio value="custom">Introdu manual</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues.subdivision !==
                            currentValues.subdivision ||
                          prevValues.indicatorMode !==
                            currentValues.indicatorMode
                        }
                      >
                        {({ getFieldValue }) => {
                          const selectedSubdivision =
                            getFieldValue("subdivision");
                          return (
                            <>
                              {indicatorMode === "select" && (
                                <Form.Item
                                  name="selectedIndicator"
                                  label="Nume indicator"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Selectați un indicator",
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    optionFilterProp="children"
                                    placeholder={
                                      selectedSubdivision
                                        ? "Selectează indicatorul"
                                        : "Selectați mai întâi subdiviziunea"
                                    }
                                    disabled={!selectedSubdivision}
                                  >
                                    {selectedSubdivision &&
                                      subdivisionIndicators[
                                        selectedSubdivision
                                      ]?.map((indicator, index) => (
                                        <Option
                                          key={`ind-${index}`}
                                          value={indicator}
                                        >
                                          {indicator}
                                        </Option>
                                      ))}
                                  </Select>
                                </Form.Item>
                              )}
                              {indicatorMode === "custom" && (
                                <Form.Item
                                  name="customIndicator"
                                  label="Nume indicator personalizat"
                                  rules={[
                                    {
                                      required: true,
                                      message:
                                        "Introduceți numele indicatorului",
                                    },
                                  ]}
                                >
                                  <Input placeholder="Introduceți numele indicatorului" />
                                </Form.Item>
                              )}
                            </>
                          );
                        }}
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="unit"
                        label="Unitate de măsură"
                        rules={[
                          {
                            required: true,
                            message: "Introduceți unitatea de măsură",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="type"
                        label="Tip agregare"
                        rules={[
                          {
                            required: true,
                            message: "Selectați tipul de agregare",
                          },
                        ]}
                      >
                        <Select>
                          <Option value="sumă">Sumă</Option>
                          <Option value="mediere">Mediere</Option>
                          <Option value="numărare">Numărare</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="description" label="Descriere">
                    <TextArea rows={3} />
                  </Form.Item>

                  {/* Câmpuri noi pentru indicator_records */}
                  <Divider>Adăugare înregistrare</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="value"
                        label="Valoare"
                        rules={[
                          { required: true, message: "Introduceți valoarea" },
                        ]}
                      >
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="recordDate"
                        label="Data"
                        rules={[{ required: true, message: "Selectați data" }]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="notes" label="Note">
                    <TextArea rows={3} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      {editingId ? "Actualizează" : "Salvează"}
                    </Button>
                  </Form.Item>
                </Form>
              </Modal>
            </>
          )}

          {activeTab === "reports" && (
  <>
    {isActivityModalVisible && (
  <Modal
   title={`Adăugare activități pentru raport ${periodMapping[reportPeriod] || reportPeriod}`}
    open={isActivityModalVisible}
    onOk={reportSubdivision === "all" ? confirmGenerateAllReports : confirmGenerateReport}
    onCancel={() => {
      setIsActivityModalVisible(false);
      setActivities([]);
      setNewActivity('');
    }}
    okText="Generează raport"
    cancelText="Anulează"
    confirmLoading={loading}
    width={700}
  >
    <div style={{ marginBottom: 16 }}>
      <Input.TextArea
        value={newActivity}
        onChange={(e) => setNewActivity(e.target.value)}
        placeholder="Descrie activitatea (ex: 'Organizat training pentru echipă')"
        rows={3}
      />
      <Button
        type="dashed"
        onClick={handleAddActivity}
        icon={<PlusOutlined />}
        style={{ marginTop: 8 }}
      >
        Adaugă activitate
      </Button>
    </div>

    <List
      bordered
      dataSource={activities}
      renderItem={(item, index) => (
        <List.Item
          actions={[
            <Button
              icon={<DeleteOutlined />}
              onClick={() => setActivities(activities.filter((_, i) => i !== index))}
              danger
              size="small"
            />
          ]}
        >
          {item}
        </List.Item>
      )}
    />
  </Modal>
)}

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <h2>Rapoarte generate</h2>
      <Space>
        <Select
          value={reportSubdivision}
          style={{ width: 200 }}
          onChange={setReportSubdivision}
          placeholder="Selectează subdiviziunea"
        >
          <Option value="all">Toate subdiviziunile</Option>
          {Object.keys(subdivisionData).map((s) => (
            <Option key={`report-subdiv-${s}`} value={s}>
              {s}
            </Option>
          ))}
        </Select>
        <Select
          value={reportPeriod}
          style={{ width: 150 }}
          onChange={setReportPeriod}
        >
          <Option value="weekly">Săptămânal</Option>
          <Option value="quarterly">Trimestrial</Option>
          <Option value="annual">Anual</Option>
        </Select>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => setIsActivityModalVisible(true)}
          loading={loading}
        >
          {reportSubdivision === "all" 
            ? "Generează toate rapoartele" 
            : "Generează raport"}
        </Button>
      </Space>
    </div>
    <Table
      dataSource={filteredReports}
      columns={[
        { 
          title: "Titlu", 
          dataIndex: "title", 
          key: "title",
          render: (title, record) => (
            <div>
              <div>{title}</div>
              {record.activities && record.activities.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <small style={{ color: '#666' }}>
                    <strong>Activități:</strong> {record.activities.join(', ')}
                  </small>
                </div>
              )}
            </div>
          )
        },
        {
          title: "Data",
          dataIndex: "date",
          key: "date",
          render: (date) => {
            if (!date) return "-";
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
          },
        },
        {
          title: "Descărcare",
          key: "download",
          render: (_, record) => (
            <Space>
              {record.downloadUrls?.pdf && (
                <Button
                  key="pdf"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(record.downloadUrls.pdf)}
                >
                  PDF
                </Button>
              )}
              {record.downloadUrls?.excel && (
                <Button
                  key="excel"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(record.downloadUrls.excel)}
                >
                  Excel
                </Button>
              )}
            </Space>
          ),
        },
      ]}
      rowKey="key"
    />
  </>
)}

          {activeTab === "admin" && (
            <Tabs defaultActiveKey="users" items={adminTabsItems} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
