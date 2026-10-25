import PDFDocument from "pdfkit";
import { Project } from "../models/Project.js";
import { ProjectRequest } from "../models/ProjectRequest.js";
import { Asset } from "../models/Asset.js";
import { MediaAsset } from "../models/MediaAsset.js";
import { User } from "../models/User.js";

export async function workspaceReportData(user, period = {}) {
  const { year, month } = period;
  const periodLabel = year ? month ? new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }) : String(year) : "All time";
  const filter = year ? { createdAt: { $gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1) - 19800000), $lt: new Date(Date.UTC(month === 12 || !month ? year + 1 : year, month ? month % 12 : 0, 1) - 19800000) } } : {};
  const [projects, requests, files, approvedDesigns, accounts] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).populate("clientId", "name").populate("designerIds", "name").lean(),
    ProjectRequest.find(filter).sort({ createdAt: -1 }).lean(),
    MediaAsset.find(filter).sort({ createdAt: -1 }).limit(12).populate("projectId", "title").lean(),
    Asset.countDocuments({ ...filter, status: "approved" }),
    user.role === "super_admin" ? User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]) : Promise.resolve([]),
  ]);
  return {
    periodLabel, generatedAt: new Date().toISOString(), preparedFor: { name: user.name, role: user.role },
    metrics: { projects: projects.length, activeProjects: projects.filter(p => p.status === "active").length, pendingRequests: requests.filter(r => r.status === "pending").length, approvedDesigns, uploads: await MediaAsset.countDocuments(filter), paidDemoAmount: requests.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + (r.paymentAmountPaise || 0), 0) / 100 },
    projects: projects.map(p => ({ id: String(p._id), title: p.title, status: p.status, client: p.clientId?.name || "Not assigned", designers: p.designerIds.map(d => d.name).join(", ") || "Not assigned" })),
    requests: requests.map(r => ({ title: r.title, status: r.status, contact: r.contactDetails || {}, amount: (r.amountPaise || 0) / 100, paymentStatus: r.paymentStatus || "unpaid" })),
    files: files.map(f => ({ title: f.title, mediaType: f.mediaType, bytes: f.fileSize, project: f.projectId?.title || "Project" })),
    accounts: accounts.map(a => ({ role: a._id, count: a.count })),
  };
}

const money = amount => `INR ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clean = value => String(value ?? "").replace(/[\u2010-\u2015]/g, "-").replace(/[^\x20-\x7e\n]/g, " ");
export function renderWorkspaceReport(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 125, left: 42, right: 42, bottom: 80 }, bufferPages: true, info: { Title: "BrandHub Workspace Report", Author: "BrandHub" } });
    const chunks = []; doc.on("data", chunk => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const width = 511, title = data.preparedFor.role === "super_admin" ? "SUPER ADMIN REPORT" : "PROJECT MANAGER REPORT";
    const header = () => {
      doc.save().strokeColor("#163a59").lineWidth(1.3).roundedRect(42, 43, 19, 19, 2).stroke().roundedRect(50, 35, 19, 19, 2).stroke().restore();
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#17344d").text("BRANDHUB", 80, 36, { lineBreak: false });
      doc.font("Helvetica").fontSize(8).fillColor("#526d84").text("CREATIVE WORK. CLEAR PROGRESS.", 80, 61, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#235c85").text(title, 42, 87, { lineBreak: false });
      doc.strokeColor("#cbdbe8").moveTo(42, 108).lineTo(553, 108).stroke(); doc.y = 126;
    };
    doc.on("pageAdded", header); header();
    const ensure = height => { if (doc.y + height > 738) doc.addPage(); };
    const section = label => { ensure(54); doc.moveDown(.7); doc.font("Helvetica-Bold").fontSize(15).fillColor("#17344d").text(label, 42, doc.y); doc.moveDown(.6); };
    const line = (text, { bold = false, size = 10, color = "#35526a" } = {}) => { ensure(size * 2.5); doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color).text(clean(text), 42, doc.y, { width, lineGap: 3 }); };
    line(`Period: ${data.periodLabel || "All time"}`, { bold: true, size: 11 });
    line(`Prepared for ${data.preparedFor.name}`, { bold: true, size: 12 });
    line(`Generated ${new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`, { size: 9 });
    const kpis = [["PROJECTS", data.metrics.projects], ["ACTIVE PROJECTS", data.metrics.activeProjects], ["PENDING REQUESTS", data.metrics.pendingRequests], ["APPROVED DESIGNS", data.metrics.approvedDesigns], ["PROJECT FILES", data.metrics.uploads], ["DEMO PAYMENTS", money(data.metrics.paidDemoAmount)]];
    const top = doc.y + 20;
    kpis.forEach(([label, value], index) => { const x = 42 + index % 3 * 174, y = top + Math.floor(index / 3) * 78; doc.roundedRect(x, y, 163, 66, 8).fill("#eef5fa"); doc.font("Helvetica-Bold").fontSize(8).fillColor("#526d84").text(label, x + 12, y + 12, { width: 140, lineBreak: false }); doc.font("Helvetica-Bold").fontSize(String(value).length > 12 ? 13 : 21).fillColor("#17344d").text(String(value), x + 12, y + 31, { width: 140, lineBreak: false }); });
    doc.y = top + 162;
    line("Prototype financial figures represent simulated payments only.", { size: 8 });
    if (data.accounts.length) { section("Account overview"); line(data.accounts.map(a => `${a.role.replaceAll("_", " ")}: ${a.count}`).join("    |    ")); }
    section("Projects and assignments");
    if (!data.projects.length) line("No projects available.");
    for (const project of data.projects) {
      doc.font("Helvetica").fontSize(9); const details = `Client: ${project.client} | Designers: ${project.designers}`;
      const height = 30 + doc.heightOfString(clean(details), { width: 390 }); ensure(height + 10);
      const y = doc.y; doc.font("Helvetica-Bold").fontSize(10).fillColor("#17344d").text(clean(project.title), 42, y, { width: 395, height: 14, ellipsis: true });
      doc.font("Helvetica").fontSize(8).fillColor("#235c85").text(project.status.replaceAll("_", " "), 449, y + 2, { width: 104, align: "right" });
      doc.font("Helvetica").fontSize(9).fillColor("#526d84").text(clean(details), 42, y + 18, { width: 390 }); doc.y = y + height; doc.strokeColor("#e2eaf1").moveTo(42, doc.y).lineTo(553, doc.y).stroke(); doc.y += 12;
    }
    section("Client requests and demo payments");
    if (!data.requests.length) line("No client requests available.");
    for (const request of data.requests) {
      ensure(100); line(`${request.title} - ${request.status}`, { bold: true });
      line(`Contact: ${request.contact.name || "Not provided"} | ${request.contact.email || "No email"} | ${request.contact.phone || "No phone"}`, { size: 9 });
      line(`Project amount: ${money(request.amount)} | Demo payment: ${request.paymentStatus}`, { size: 9 }); doc.moveDown(.8);
    }
    section("Recent project files");
    line("Latest 12 files; photo, video and document uploads are retained in their project workspace.", { size: 9 }); doc.moveDown(.5);
    for (const file of data.files) { ensure(54); line(file.title, { bold: true }); line(`${file.mediaType} | ${(file.bytes / 1024).toFixed(1)} KB | ${file.project}`, { size: 9 }); doc.moveDown(.6); }
    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index++) { doc.switchToPage(index); const savedBottom = doc.page.margins.bottom; doc.page.margins.bottom = 0; doc.strokeColor("#cbdbe8").moveTo(42, 771).lineTo(553, 771).stroke(); doc.font("Helvetica").fontSize(8).fillColor("#526d84").text("BrandHub - Workspace report - Prototype", 42, 784, { width: 390, lineBreak: false }); doc.text(`${index + 1} / ${range.count}`, 480, 784, { width: 73, align: "right", lineBreak: false }); doc.page.margins.bottom = savedBottom; }
    doc.end();
  });
}
