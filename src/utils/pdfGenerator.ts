import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BillRecord } from '../services/billService';

// Format YYYY-MM-DD to DD/MM/YYYY
const formatNumericalDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const generateBillPDF = (bill: BillRecord) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Header - Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('SAKTHI FERRO ALLOYS INDIA PRIVATE LIMITED', 105, 18, { align: 'center' });

  // Subtitle under title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('freight invoice against enclosed list', 105, 24, { align: 'center' });

  // Header Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  // 2. Billing Info (Billed To, Name, Address, Phone & Billing Date)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Billed To:', 14, 34);

  doc.setFontSize(9.5);
  // Name line
  doc.text('Name:', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.freightPartyName || '-', 32, 40);

  // Address line
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 14, 46);
  doc.setFont('helvetica', 'normal');
  const addressText = bill.partyAddress || 'Address not registered';
  const splitAddress = doc.splitTextToSize(addressText, 95);
  doc.text(splitAddress, 32, 46);

  let currentY = 46 + (splitAddress.length * 4.2);

  if (bill.partyPhone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(bill.partyPhone, 32, currentY);
    currentY += 5;
  }

  // Right Side - Date of Billing Only
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Date of Billing:', 135, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumericalDate(bill.billingDate), 165, 34);

  // 3. Table Setup
  const tableStartY = Math.max(58, currentY + 3);

  const tableRows = bill.items.map((item, idx) => [
    idx + 1,
    formatNumericalDate(item.date),
    item.loryNo,
    item.driverName || '-',
    `${item.loadingFrom} -> ${item.loadingTo}`,
    item.weight ? `${item.weight} MT` : '-',
    `Rs. ${item.freightAmount.toLocaleString('en-IN')}`
  ]);

  // Append Total Row
  tableRows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    `${bill.totalWeight} MT`,
    `Rs. ${bill.totalFreightAmount.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Serial No', 'Date', 'Lorry No', 'Driver Name', 'From -> To', 'Quantity', 'Freight Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // dark navy blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      3: { halign: 'left', cellWidth: 32 },
      4: { halign: 'left', cellWidth: 38 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Style the TOTAL row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
    }
  });

  // 4. Footer & Metadata
  const finalY = (doc as any).lastAutoTable.finalY || 220;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, finalY + 12, 196, finalY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Metadata: Bill generated on ${bill.generatedAt}`, 14, finalY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('For SAKTHI FERRO ALLOYS INDIA PRIVATE LIMITED', 196, finalY + 18, { align: 'right' });

  // Download PDF
  const sanitizedParty = bill.freightPartyName ? bill.freightPartyName.replace(/[^a-zA-Z0-9]/g, '_') : 'Party';
  const filename = `Bill_${bill.billNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_${sanitizedParty}.pdf`;
  doc.save(filename);
};
