import { API_MODE, request, requestBlob, buildQuery } from "./api-client";
import { mockAdapter } from "./mock/adapter";
import type { ApiAdapter } from "./api/adapter";
import { masterApiSlug } from "@/types/masters";

function masterCollectionPath(resource: Parameters<ApiAdapter["listMasters"]>[0]): string {
  return `/${masterApiSlug(resource)}`;
}

function buildRealAdapter(): ApiAdapter {
  return {
    mode: "real",
    login: (p) => request("/auth/login/", { method: "POST", body: JSON.stringify(p) }),
    logout: () => request("/auth/logout/", { method: "POST" }),
    getMe: () => request("/auth/me/"),
    requestPasswordReset: (p) =>
      request("/auth/password-reset/", { method: "POST", body: JSON.stringify(p) }),
    listMasters: (r, p) => request(`${masterCollectionPath(r)}${buildQuery(p)}`),
    getMaster: (r, id) => request(`/${id}/${masterApiSlug(r)}`),
    createMaster: (r, p) => request(masterCollectionPath(r), { method: "POST", body: JSON.stringify(p) }),
    updateMaster: (r, id, p) =>
      request(`/${id}/update_${masterApiSlug(r)}`, { method: "PUT", body: JSON.stringify(p) }),
    deleteMaster: (r, id) => request(`/${id}/delete_${masterApiSlug(r)}`, { method: "DELETE" }),
    listInstitutions: (p) => request(`/institution${buildQuery(p)}`),
    getInstitution: (id) => request(`/${id}/institution`),
    createInstitution: (p) => request(`/institution`, { method: "POST", body: JSON.stringify(p) }),
    updateInstitution: (id, p) =>
      request(`/${id}/update_institution`, { method: "PUT", body: JSON.stringify(p) }),
    deleteInstitution: (id) => request(`/${id}/delete_institution`, { method: "DELETE" }),
    listWorks: (p) => request(`/work${buildQuery(p)}`),
    getWork: (id) => request(`/${id}/work`),
    createWork: (p) => request(`/work`, { method: "POST", body: JSON.stringify(p) }),
    updateWork: (id, p) => request(`/${id}/update_work`, { method: "PUT", body: JSON.stringify(p) }),
    deleteWork: (id) => request(`/${id}/delete_work`, { method: "DELETE" }),
    getDashboardSummary: (p) => request(`/dashboard/summary/${buildQuery(p)}`),
    getReport: (slug, p) => request(`/reports/${slug}/${buildQuery(p)}`),
    exportReport: async (slug, format, p) => {
      const { blob, filename } = await requestBlob(`/reports/${slug}/${format}/${buildQuery(p)}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    getWorksSummary: (p) => request(`/reports/works-summary/${buildQuery(p)}`),
    getDistrictSummary: (p) => request(`/reports/district-summary/${buildQuery(p)}`),
    getCategorySummary: (p) => request(`/reports/category-summary/${buildQuery(p)}`),
    getFinancialProgress: (p) => request(`/reports/financial-progress/${buildQuery(p)}`),
    getPhysicalProgress: (p) => request(`/reports/physical-progress/${buildQuery(p)}`),
    getInstitutionCoverage: (p) => request(`/reports/institution-coverage/${buildQuery(p)}`),
    uploadExcel: (files) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      return request("/imports/excel/", { method: "POST", body: fd });
    },
    listBatches: (p) => request(`/imports/batches/${buildQuery(p)}`),
    getBatch: (id) => request(`/imports/batches/${id}/`),
    listAuditRows: (p) => request(`/imports/audit/${buildQuery(p)}`),
    listMenus: (p) => request(`/menu${buildQuery(p)}`),
    createMenu: (p) => request(`/menu`, { method: "POST", body: JSON.stringify(p) }),
    updateMenu: (id, p) => request(`/${id}/update_menu`, { method: "PUT", body: JSON.stringify(p) }),
    deleteMenu: (id) => request(`/${id}/delete_menu`, { method: "DELETE" }),
    listRoles: (p) => request(`/role${buildQuery(p)}`),
    createRole: (p) => request(`/role`, { method: "POST", body: JSON.stringify(p) }),
    updateRole: (id, p) => request(`/${id}/update_role`, { method: "PUT", body: JSON.stringify(p) }),
    deleteRole: (id) => request(`/${id}/delete_role`, { method: "DELETE" }),
    updateRoleAccess: (id, access) =>
      request(`/${id}/role_access`, { method: "PUT", body: JSON.stringify({ access }) }),
    listUsers: (p) => request(`/user${buildQuery(p)}`),
    createUser: (p) => request(`/user`, { method: "POST", body: JSON.stringify(p) }),
    updateUser: (id, p) => request(`/${id}/update_user`, { method: "PUT", body: JSON.stringify(p) }),
    deleteUser: (id) => request(`/${id}/delete_user`, { method: "DELETE" }),
  };
}

export const api: ApiAdapter = API_MODE === "real" ? buildRealAdapter() : mockAdapter;
