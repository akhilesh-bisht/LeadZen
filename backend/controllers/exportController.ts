/**
 * ============================================================================
 * CONTROLLER: ExportController
 * ============================================================================
 * Generates custom structured Excel (.xlsx) spreadsheets from database leads
 * using SheetJS, formatting all contact, rep assignment, address, and CRM fields.
 * ============================================================================
 */

import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { getLeadsForExport } from "../mongodb.js";
import { formatLeadForExcel } from "../../src/lib/utils.js";

export class ExportController {
  /**
   * GET /api/export
   * Generates downloadable Excel workbook
   */
  public static async exportLeads(req: Request, res: Response) {
    try {
      const { status, category, city, assignedTo, ids } = req.query;

      let idList: string[] | undefined = undefined;
      if (typeof ids === "string" && ids.trim()) {
        idList = ids.split(",").map((s) => s.trim());
      }

      const leads = await getLeadsForExport({
        status: status ? String(status) : undefined,
        category: category ? String(category) : undefined,
        city: city ? String(city) : undefined,
        assignedTo: assignedTo ? String(assignedTo) : undefined,
        ids: idList,
      });

      // Format real records
      const formattedRows = leads.map(formatLeadForExcel);

      // Create workbook with SheetJS
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ProspectPulse Leads");

      // Set optimal column widths
      worksheet["!cols"] = [
        { wch: 30 }, // Business Name
        { wch: 20 }, // Category
        { wch: 20 }, // Assigned Rep
        { wch: 35 }, // Address
        { wch: 15 }, // City
        { wch: 18 }, // Phone
        { wch: 25 }, // Email
        { wch: 30 }, // Website
        { wch: 25 }, // Instagram
        { wch: 25 }, // LinkedIn
        { wch: 25 }, // Facebook
        { wch: 35 }, // Google Maps URL
        { wch: 8 }, // Rating
        { wch: 12 }, // Review Count
        { wch: 15 }, // Status
        { wch: 30 }, // Notes
        { wch: 20 }, // Source
        { wch: 15 }, // Assigned At
        { wch: 15 }, // Created At
        { wch: 15 }, // Updated At
      ];

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      const dateStamp = new Date().toISOString().split("T")[0];
      const filename = `prospectpulse-leads-${dateStamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      return res.send(buffer);
    } catch (error) {
      console.error("ExportController.exportLeads error:", error);
      return res
        .status(500)
        .json({ error: "Failed to generate Excel export file." });
    }
  }
}
