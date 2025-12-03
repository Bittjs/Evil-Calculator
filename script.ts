declare const html2canvas: any;

type Entry = {
    id: number;
    name: string;
    amount: number;
    type: 'income' | 'expense';
}

document.addEventListener('DOMContentLoaded', () => {
    class Calculator {
        entries: Entry[] = [];
        
        constructor() {
            this.loadEntries();
            this.setupEventListeners();
            this.updateUI();
            this.setReceiptDate();
        }
        
        loadEntries(): void {
            const saved = localStorage.getItem('receiptEntries');
            if (saved) {
                this.entries = JSON.parse(saved);
            }
        }
        
        saveEntries(): void {
            localStorage.setItem('receiptEntries', JSON.stringify(this.entries));
        }
        
        setupEventListeners(): void {
            document.getElementById('addBtn')!.addEventListener('click', () => this.addEntry());
            
            document.getElementById('entryAmount')!.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addEntry();
                }
            });
        }
        
        parseAmount(input: string, type: string): number {
            const trimmed = input.trim();
            
            const onlyAmount = trimmed.replace(/^[+-]/, '');
            const num = parseFloat(onlyAmount);
            
            if (isNaN(num) || num <= 0) {
                return 0;
            }
            
            return type === 'income' ? num : -num;
        }
        
        addEntry(): void {
            const nameInput = document.getElementById('entryName') as HTMLInputElement;
            const amountInput = document.getElementById('entryAmount') as HTMLInputElement;
            const typeInput = document.getElementById('entryType') as HTMLSelectElement;
            
            const name = nameInput.value.trim();
            const type = typeInput.value as 'income' | 'expense';
            const amount = this.parseAmount(amountInput.value, type);
            
            if (!name || amount === 0) {
                alert('you need to enter both name and an amount');
                return;
            }
            
            const newEntry: Entry = {
                id: Date.now(),
                name,
                amount,
                type
            };
            
            this.entries.unshift(newEntry);
            this.saveEntries();
            
            nameInput.value = '';
            amountInput.value = '';
            nameInput.focus();
            
            this.updateUI();
        }
        
        deleteEntry(id: number): void {
            this.entries = this.entries.filter(entry => entry.id !== id);
            this.saveEntries();
            this.updateUI();
        }
        
        calculateTotal(): number {
            return this.entries.reduce((sum, entry) => sum + entry.amount, 0);
        }
        
        setReceiptDate(): void {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('receipt-date')!.textContent = dateStr;
        }
        
        updateUI(): void {
            this.updateReceipt();
        }
        
        updateReceipt(): void {
            const container = document.getElementById('receiptEntries')!;
            
            if (this.entries.length === 0) {
                container.innerHTML = '<div class="empty-receipt">No transactions yet</div>';
                document.getElementById('receiptTotal')!.textContent = '0 ₽';
                return;
            }
            
            container.innerHTML = '';
            let total = 0;
            
            this.entries.forEach(entry => {
                total += entry.amount;
                
                const entryEl = document.createElement('div');
                entryEl.className = 'receipt-entry';
                
                const amountFormatted = entry.type === 'income' 
                    ? `+${Math.abs(entry.amount).toFixed(2)}` 
                    : `-${Math.abs(entry.amount).toFixed(2)}`;
                
                entryEl.innerHTML = `
                    <div class="entry-info">
                        <div class="entry-name">${entry.name}</div>
                        <div class="entry-type">${entry.type.toUpperCase()}</div>
                    </div>
                    <div>
                        <span class="entry-amount ${entry.type}">${amountFormatted} ₽</span>
                        <button class="delete-btn" data-id="${entry.id}">×</button>
                    </div>
                `;
                
                container.appendChild(entryEl);
            });
            
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id')!);
                    this.deleteEntry(id);
                });
            });
            
            const receiptTotal = document.getElementById('receiptTotal')!;
            receiptTotal.textContent = `${total >= 0 ? '+' : ''}${total.toFixed(2)} ₽`;
            receiptTotal.style.color = total >= 0 ? '#26a660' : '#be331e';
        }
    }

    new Calculator();
    const receipt = document.getElementById('receipt');
    const exportBtn = document.getElementById('export-btn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (receipt) {
                html2canvas(receipt, {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: '#ffffff'
                }).then((canvas:any) => {
                    const imgData = canvas.toDataURL('image/png');
                    
                    const link = document.createElement('a');
                    link.href = imgData;
                    link.download = 'evilreceipt.png';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }).catch((error:any) => {
                    console.error('bruh', error);
                });
            }
        });
    }
});