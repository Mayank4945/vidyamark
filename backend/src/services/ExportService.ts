import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { query } from '../database';

export class ExportService {
  /**
   * Export marks to Excel
   */
  static async exportMarksToExcel(examId: number, filePath: string) {
    const excelData = await query(
      `SELECT 
        e.exam_name,
        e.exam_date,
        e.max_marks,
        s.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        m.marks_obtained,
        ROUND((m.marks_obtained / e.max_marks) * 100, 2) as percentage,
        m.is_absent,
        m.remarks
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN exams e ON m.exam_id = e.id
       WHERE m.exam_id = $1
       ORDER BY s.roll_number`,
      [examId]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Marks');

    // Add title
    const titleRow = worksheet.addRow(['Exam Results']);
    titleRow.font = { size: 14, bold: true };
    worksheet.mergeCells('A1:I1');

    // Add metadata
    const data = excelData.rows[0];
    worksheet.addRow([]);
    worksheet.addRow(['Exam Name:', data.exam_name]);
    worksheet.addRow(['Exam Date:', new Date(data.exam_date).toLocaleDateString()]);
    worksheet.addRow(['Max Marks:', data.max_marks]);
    worksheet.addRow([]);

    // Add header row
    const headers = ['Roll Number', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade', 'Absent', 'Remarks'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Add data rows
    excelData.rows.forEach((row: any) => {
      worksheet.addRow([
        row.roll_number,
        row.student_name,
        row.marks_obtained,
        data.max_marks,
        row.percentage,
        row.percentage >= 40 ? 'PASS' : 'FAIL',
        row.is_absent ? 'Yes' : 'No',
        row.remarks || ''
      ]);
    });

    // Format columns
    worksheet.columns = [
      { width: 12 },
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 20 }
    ];

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Export marks to CSV
   */
  static async exportMarksToCSV(examId: number, filePath: string) {
    const csvData = await query(
      `SELECT 
        s.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        m.marks_obtained,
        e.max_marks,
        ROUND((m.marks_obtained / e.max_marks) * 100, 2) as percentage,
        m.is_absent,
        m.remarks
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN exams e ON m.exam_id = e.id
       WHERE m.exam_id = $1
       ORDER BY s.roll_number`,
      [examId]
    );

    const data = [
      ['Roll Number', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage', 'Absent', 'Remarks'],
      ...csvData.rows.map((row: any) => [
        row.roll_number,
        row.student_name,
        row.marks_obtained.toString(),
        row.max_marks.toString(),
        row.percentage.toString(),
        row.is_absent ? 'Yes' : 'No',
        row.remarks || ''
      ])
    ];

    const csv = stringify(data);
    fs.writeFileSync(filePath, csv);
    return filePath;
  }

  /**
   * Export report card to PDF
   */
  static async exportReportCardToPDF(studentId: number, classId: number, semester: string, filePath: string) {
    // Fetch student data
    const studentData = await query(
      `SELECT s.*, c.name as class_name, sc.name as school_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       JOIN schools sc ON s.school_id = sc.id
       WHERE s.id = $1`,
      [studentId]
    );

    // Fetch performance data
    const performanceData = await query(
      `SELECT 
        sub.name as subject_name,
        cp.total_marks_obtained,
        cp.total_marks_possible,
        cp.percentage,
        cp.grade
       FROM class_performance cp
       JOIN subjects sub ON cp.subject_id = sub.id
       WHERE cp.student_id = $1 AND cp.class_id = $2 AND cp.semester = $3
       ORDER BY sub.name`,
      [studentId, classId, semester]
    );

    const student = studentData.rows[0];
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(student.school_name, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Report Card', { align: 'center' });
    doc.fontSize(10).text(`${semester}`, { align: 'center' });
    doc.moveDown();

    // Student Info
    doc.fontSize(11).font('Helvetica-Bold').text('Student Information', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${student.first_name} ${student.last_name}`);
    doc.text(`Roll Number: ${student.roll_number}`);
    doc.text(`Class: ${student.class_name}`);
    doc.text(`Email: ${student.email || 'N/A'}`);
    doc.moveDown();

    // Performance Table
    doc.fontSize(11).font('Helvetica-Bold').text('Subject Performance', { underline: true });
    doc.moveDown(0.5);

    let y = doc.y;
    const colWidths = [150, 80, 80, 80, 60];
    
    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Subject', 70, y, { width: colWidths[0] });
    doc.text('Marks', 70 + colWidths[0], y, { width: colWidths[1] });
    doc.text('Total', 70 + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
    doc.text('Percentage', 70 + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
    doc.text('Grade', 70 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });

    doc.moveTo(70, y + 15).lineTo(70 + colWidths.reduce((a, b) => a + b, 0), y + 15).stroke();
    y += 20;

    // Table rows
    doc.font('Helvetica');
    performanceData.rows.forEach((row: any) => {
      doc.text(row.subject_name, 70, y, { width: colWidths[0] });
      doc.text(row.total_marks_obtained.toString(), 70 + colWidths[0], y, { width: colWidths[1] });
      doc.text(row.total_marks_possible.toString(), 70 + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
      doc.text(row.percentage.toFixed(2) + '%', 70 + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
      doc.text(row.grade, 70 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });
      y += 15;
    });

    doc.moveDown(2);
    doc.fontSize(9).text('Generated on: ' + new Date().toLocaleDateString());

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Export class performance summary to Excel
   */
  static async exportClassPerformanceSummary(classId: number, semester: string, filePath: string) {
    const data = await query(
      `SELECT 
        s.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        GROUP_CONCAT(DISTINCT sub.name ORDER BY sub.name SEPARATOR ', ') as subjects,
        ROUND(AVG(cp.percentage), 2) as overall_percentage,
        COUNT(DISTINCT cp.subject_id) as total_subjects,
        SUM(CASE WHEN cp.percentage >= 40 THEN 1 ELSE 0 END) as passed_subjects
       FROM students s
       LEFT JOIN class_performance cp ON s.id = cp.student_id
       LEFT JOIN subjects sub ON cp.subject_id = sub.id
       WHERE s.class_id = $1 AND cp.semester = $2
       GROUP BY s.id, s.roll_number, s.first_name, s.last_name
       ORDER BY overall_percentage DESC, s.roll_number`,
      [classId, semester]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Class Performance');

    // Headers
    const headers = ['Roll Number', 'Student Name', 'Overall %', 'Passed Subjects', 'Total Subjects', 'Rank'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Data
    let rank = 1;
    data.rows.forEach((row: any) => {
      worksheet.addRow([
        row.roll_number,
        row.student_name,
        row.overall_percentage,
        row.passed_subjects,
        row.total_subjects,
        rank++
      ]);
    });

    worksheet.columns = [
      { width: 12 },
      { width: 20 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 10 }
    ];

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }
}
