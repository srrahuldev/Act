import * as XLSX from 'xlsx';
import { getLocalDateString } from './dateUtils';
import { auth } from '../firebase';
// Auto-save all data to Excel after every change
const DATA_KEY_TRANSACTIONS = 'demo_transactions';
const DATA_KEY_CUSTOMERS = 'demo_customers';

export const autoSaveToExcel = (transactions = [], customers = []) => {
  try {
    const wb = XLSX.utils.book_new();

    // Transactions Sheet
    if (transactions.length > 0) {
      const txData = transactions.map((t, i) => ({
        'S.No': i + 1,
        'Name': t.name || '',
        'Last Name': t.lastName || '',
        'Amount': Number(t.amount) || 0,
        'Type': t.type || '',
        'Category': t.category || 'General',
        'Description': t.description || '',
        'Date': t.date ? new Date(t.date).toLocaleDateString('en-IN') : '',
        'Created': t.createdAt ? (t.createdAt.toDate ? new Date(t.createdAt.toDate()).toLocaleString('en-IN') : new Date(t.createdAt).toLocaleString('en-IN')) : ''
      }));
      const wsTransactions = XLSX.utils.json_to_sheet(txData);
      
      wsTransactions['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
        { wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');
    }

    // Customers Sheet
    if (customers.length > 0) {
      const custData = customers.map((c, i) => ({
        'S.No': i + 1,
        'Name': c.name || '',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Balance': c.balance || 0,
        'Total Credit': c.totalCredit || 0,
        'Total Debit': c.totalDebit || 0
      }));
      const wsCustomers = XLSX.utils.json_to_sheet(custData);
      wsCustomers['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');
    }

    // Summary Sheet
    const totalCredit = transactions.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
    const totalDebit = transactions.filter(t => t.type === 'Debit' || t.type === 'EMI').reduce((s, t) => s + Number(t.amount), 0);
    
    const summaryData = [
      { 'Item': 'Total Entries', 'Value': transactions.length },
      { 'Item': 'Total Credit', 'Value': totalCredit },
      { 'Item': 'Total Debit', 'Value': totalDebit },
      { 'Item': 'Net Balance', 'Value': totalCredit - totalDebit },
      { 'Item': 'Total Customers', 'Value': customers.length },
      { 'Item': 'Last Updated', 'Value': new Date().toLocaleString('en-IN') }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const userId = auth.currentUser?.uid;
    if (userId) {
      localStorage.setItem(`lastAutoSave_${userId}`, JSON.stringify({
        url,
        time: new Date().toISOString(),
        entries: transactions.length,
        customers: customers.length
      }));
    }

    return url;
  } catch (err) {
    console.error('Excel auto-save error:', err);
    return null;
  }
};

export const downloadBackup = (transactions, customers) => {
  const url = autoSaveToExcel(transactions, customers);
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `AccountManager_Backup_${getLocalDateString()}.xlsx`;
    a.click();
  }
};
