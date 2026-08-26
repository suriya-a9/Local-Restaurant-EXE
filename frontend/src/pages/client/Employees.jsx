import React, { useEffect, useState } from "react";
import {
    Users,
    Plus,
    X,
    Check,
    Search,
    Pencil,
    Trash2,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";
import EntityTable from "../../components/EntityTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    business_location_id: "",
    designation: "",
    date_of_joining: "",
    salary: "",
    role: "",
};

const Employees = () => {
    const { token, clientId } = useAuth();
    const isElectron = Boolean(window.electronAPI);

    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [locations, setLocations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (isElectron && !clientId) return;
        loadEmployees();
        loadRoles();
        loadLocations();
    }, [clientId]);

    function authHeaders() {
        return {
            Accept: "application/json",
            ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {}),
        };
    }

    async function loadEmployees() {
        setLoading(true); setError(null);
        try {
            if (isElectron) { const data=await window.electronAPI.employees.getAll(clientId); setEmployees(Array.isArray(data)?data:[]); return; }
            const res=await fetch(`${API_BASE_URL}/api/client/employees${clientId?`?client_id=${clientId}`:""}`,{headers:authHeaders()});
            const json=await res.json(); if(!res.ok||!json.success)throw new Error(json.message||"Failed to load employees");
            const data=json.data; setEmployees(Array.isArray(data?.data)?data.data:Array.isArray(data)?data:[]);
        }catch(err){console.error("Load employees error:",err);setError(err.message);setEmployees([])}finally{setLoading(false)}
    }

    async function loadRoles() {
        try {
            if (isElectron) { const data=await window.electronAPI.employees.getRoles(); setRoles(Array.isArray(data)?data:[]); return; }
            const res=await fetch(`${API_BASE_URL}/api/client/roles${clientId?`?client_id=${clientId}`:""}`,{headers:authHeaders()});
            const json=await res.json(); if(!res.ok||!json.success)throw new Error(json.message||"Failed to load roles"); setRoles(Array.isArray(json.data)?json.data:[]);
        }catch(err){console.error("Load roles error:",err);setError(err.message)}
    }

    async function loadLocations() {
        try {
            if (isElectron) { const data=await window.electronAPI.businessLocations.getAll(clientId); setLocations(Array.isArray(data)?data:[]); return; }
            const res=await fetch(`${API_BASE_URL}/api/client/business-locations?per_page=1000${clientId?`&client_id=${clientId}`:""}`,{headers:authHeaders()});
            const json=await res.json(); if(!res.ok||!json.success)throw new Error(json.message||"Failed to load business locations");
            setLocations(Array.isArray(json.data?.data)?json.data.data:Array.isArray(json.data)?json.data:[]);
        }catch(err){console.error("Load business locations error:",err);setError(err.message)}
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    async function openEditForm(employee) {
        setEditingId(employee.id); setFormErrors({}); setError(null); setShowForm(true); setSaving(true);
        try {
            let employeeData;
            if (isElectron) {
                employeeData = await window.electronAPI.employees.getById(employee.id, clientId);
                if (!employeeData) throw new Error("Employee not found");
            } else {
                const res=await fetch(`${API_BASE_URL}/api/client/employees/${employee.id}?client_id=${clientId}`,{headers:authHeaders()});
                const json=await res.json(); if(!res.ok||!json.success)throw new Error(json.message||"Failed to load employee");
                employeeData=json.data?.employee||json.data;
            }
            setForm({
                name: employeeData?.name||"", email: employeeData?.email||"", password:"", phone:employeeData?.phone||"",
                business_location_id: employeeData?.business_location?.id||employeeData?.business_location_id||"",
                designation: employeeData?.designation||"", date_of_joining: employeeData?.date_of_joining ? String(employeeData.date_of_joining).substring(0,10) : "",
                salary: employeeData?.salary??"", role: employeeData?.role?.name||(Array.isArray(employeeData?.roles)?employeeData.roles[0]?.name||"":employeeData?.role||""),
            });
        }catch(err){console.error("Load employee error:",err);setError(err.message);setShowForm(false)}finally{setSaving(false)}
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setFormErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault(); setSaving(true); setError(null); setFormErrors({});
        const payload={client_id:clientId,name:form.name.trim(),email:form.email.trim(),phone:form.phone.trim(),business_location_id:form.business_location_id,designation:form.designation.trim(),date_of_joining:form.date_of_joining,salary:form.salary===""?null:Number(form.salary),role:form.role};
        if(!editingId||form.password)payload.password=form.password;
        try {
            if(isElectron){
                if(editingId)await window.electronAPI.employees.update({...payload,id:editingId});
                else await window.electronAPI.employees.create({...payload,id:crypto.randomUUID()});
                closeForm(); if(!editingId)setCurrentPage(1); await loadEmployees(); return;
            }
            const url=editingId?`${API_BASE_URL}/api/client/employees/${editingId}`:`${API_BASE_URL}/api/client/employees`;
            const res=await fetch(url,{method:editingId?"PUT":"POST",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify(payload)});
            const json=await res.json(); if(!res.ok||!json.success){if(json.errors)setFormErrors(json.errors);throw new Error(json.message||(editingId?"Failed to update employee":"Failed to create employee"))}
            closeForm(); if(!editingId)setCurrentPage(1); await loadEmployees();
        }catch(err){console.error("Save employee error:",err);setError(err.message)}finally{setSaving(false)}
    }

    function requestDelete(employee) {
        setError(null);
        setDeleteTarget(employee);
    }

    function cancelDelete() {
        if (deletingId) return;
        setDeleteTarget(null);
    }

    async function confirmDelete() {
        if(!deleteTarget)return; setDeletingId(deleteTarget.id); setError(null);
        try{
            if(isElectron)await window.electronAPI.employees.delete(deleteTarget.id,clientId);
            else{const res=await fetch(`${API_BASE_URL}/api/client/employees/${deleteTarget.id}?client_id=${clientId}`,{method:"DELETE",headers:authHeaders()});const json=await res.json();if(!res.ok||!json.success)throw new Error(json.message||"Failed to delete employee")}
            setDeleteTarget(null);if(paginatedEmployees.length===1&&currentPage>1)setCurrentPage((prev)=>prev-1);await loadEmployees();
        }catch(err){console.error("Delete employee error:",err);setError(err.message)}finally{setDeletingId(null)}
    }

    function getRoleName(employee) {
        if (Array.isArray(employee.roles) && employee.roles.length > 0) {
            return employee.roles
                .map((role) => role.name)
                .join(", ");
        }

        if (employee.role?.name) {
            return employee.role.name;
        }

        if (typeof employee.role === "string") {
            return employee.role;
        }

        return employee.role_name || "—";
    }

    function getLocationName(employee) {
        if (employee.business_location?.name) {
            return employee.business_location.name;
        }

        if (employee.businessLocation?.name) {
            return employee.businessLocation.name;
        }

        const location = locations.find(
            (item) =>
                String(item.id) ===
                String(employee.business_location_id)
        );

        return location?.name || "—";
    }

    const filteredEmployees = Array.isArray(employees)
        ? employees.filter((employee) => {
            const searchValue = search.toLowerCase();

            return (
                employee.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.email
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.phone
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.designation
                    ?.toLowerCase()
                    .includes(searchValue) ||
                getRoleName(employee)
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        })
        : [];

    const totalPages = Math.ceil(
        filteredEmployees.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedEmployees = filteredEmployees.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    function getFormError(field) {
        if (!formErrors[field]) return null;

        return Array.isArray(formErrors[field])
            ? formErrors[field][0]
            : formErrors[field];
    }

    function inputClass(field) {
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500 ${formErrors[field]
            ? "border-rose-400"
            : "border-zinc-200/80"
            }`;
    }

    function handlePageChange(page) {
        setCurrentPage(page);
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-5">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-6 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                        Employees
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {employees.length} Employee
                        {employees.length === 1
                            ? ""
                            : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Employee
                </button>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mt-6 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6"
                >

                    <div className="mb-6 flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-900">
                                {editingId
                                    ? "Edit Employee"
                                    : "New Employee"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {editingId
                                    ? "Update employee information."
                                    : "Create a new employee account."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>

                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ravi Kumar"
                                className={inputClass("name")}
                            />

                            {getFormError("name") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("name")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                placeholder="ravi@pizzapalace.com"
                                className={inputClass("email")}
                            />

                            {getFormError("email") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("email")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="9876500011"
                                className={inputClass("phone")}
                            />

                            {getFormError("phone") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("phone")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Password
                                {editingId && (
                                    <span className="ml-1 normal-case text-zinc-400">
                                        (leave blank to keep current)
                                    </span>
                                )}
                            </label>

                            <input
                                type="password"
                                name="password"
                                required={!editingId}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="password123"
                                className={inputClass("password")}
                            />

                            {getFormError("password") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("password")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Business Location
                            </label>

                            <select
                                name="business_location_id"
                                required
                                value={form.business_location_id}
                                onChange={handleChange}
                                className={inputClass("business_location_id")}
                            >
                                <option value="">
                                    Select location
                                </option>

                                {locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.name}
                                        {location.code
                                            ? ` (${location.code})`
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            {getFormError("business_location_id") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("business_location_id")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Designation
                            </label>

                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder="Floor Manager"
                                className={inputClass("designation")}
                            />

                            {getFormError("designation") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("designation")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Date of Joining
                            </label>

                            <input
                                type="date"
                                name="date_of_joining"
                                value={form.date_of_joining}
                                onChange={handleChange}
                                className={inputClass("date_of_joining")}
                            />

                            {getFormError("date_of_joining") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("date_of_joining")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Salary
                            </label>

                            <input
                                type="number"
                                name="salary"
                                min="0"
                                value={form.salary}
                                onChange={handleChange}
                                placeholder="25000"
                                className={inputClass("salary")}
                            />

                            {getFormError("salary") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("salary")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Role
                            </label>

                            <select
                                name="role"
                                required
                                value={form.role}
                                onChange={handleChange}
                                className={inputClass("role")}
                            >
                                <option value="">
                                    Select role
                                </option>

                                {roles.map((role) => (
                                    <option
                                        key={role.id}
                                        value={role.name}
                                    >
                                        {role.name.charAt(0).toUpperCase() +
                                            role.name.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {getFormError("role") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("role")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />

                            {saving
                                ? editingId
                                    ? "Updating..."
                                    : "Creating..."
                                : editingId
                                    ? "Update Employee"
                                    : "Create Employee"}
                        </button>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                        >
                            Cancel
                        </button>

                    </div>
                </form>
            )}

            <div className="mt-8">
                <div className="relative max-w-md">

                    <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search employees..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />

                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading employees...
                    </p>
                ) : filteredEmployees.length === 0 ? (
                    <div className="p-10 text-center">

                        <Users
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No employees found."
                                : "No employees yet."}
                        </p>

                    </div>
                ) : (<>
                    <EntityTable
                        columns={[{ key: "name", label: "Employee" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "role", label: "Role" }, { key: "location", label: "Location" }]}
                        rows={paginatedEmployees}
                        onEdit={openEditForm}
                        onDelete={requestDelete}
                        renderCells={(employee) => <><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users size={16} /></div><span className="text-sm font-bold text-zinc-900">{employee.name}</span></div></td><td className="px-5 py-4 text-sm text-zinc-600">{employee.email || "-"}</td><td className="px-5 py-4 text-sm text-zinc-600">{employee.phone || "-"}</td><td className="px-5 py-4 text-sm text-zinc-600">{getRoleName(employee)}</td><td className="px-5 py-4 text-sm text-zinc-600">{getLocationName(employee)}</td></>}
                    />
                    {/*

                        {paginatedEmployees.map((employee) => (
                            <div
                                key={employee.id}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 p-5 transition-colors hover:bg-zinc-50/30"
                            >

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Users size={18} />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {employee.name}
                                            </h3>

                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                                                {getRoleName(employee)}
                                            </span>

                                        </div>

                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">

                                            {employee.email && (
                                                <span>{employee.email}</span>
                                            )}

                                            {employee.phone && (
                                                <span>{employee.phone}</span>
                                            )}

                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">

                                            {employee.designation && (
                                                <span className="font-medium text-zinc-600">
                                                    {employee.designation}
                                                </span>
                                            )}

                                            <span className="text-zinc-400">
                                                {getLocationName(employee)}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <div className="flex items-center gap-2 lg:justify-end">

                                    <button
                                        type="button"
                                        onClick={() => openEditForm(employee)}
                                        title="Edit Employee"
                                        aria-label="Edit Employee"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        <Pencil size={14} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => requestDelete(employee)}
                                        title="Delete Employee"
                                        aria-label="Delete Employee"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>*/}</>)}
            </div>

            {!loading &&
                filteredEmployees.length > 0 &&
                totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">

                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

                        <h3 className="text-sm font-bold text-zinc-900">
                            Delete this employee?
                        </h3>

                        <p className="mt-2 text-sm text-zinc-500">
                            <span className="font-semibold text-zinc-700">
                                {deleteTarget.name}
                            </span>{" "}
                            will be permanently removed. This can't be undone.
                        </p>

                        <div className="mt-6 flex gap-3">

                            <button
                                onClick={confirmDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={14} />

                                {deletingId === deleteTarget.id
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                            <button
                                onClick={cancelDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Employees;