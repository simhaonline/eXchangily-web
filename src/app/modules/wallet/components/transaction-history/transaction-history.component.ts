import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { StorageService } from '../../../../services/storage.service';
import { TransactionItem } from '../../../../models/transaction-item';
import { CoinsPrice } from '../../../../interfaces/balance.interface';
import { UtilService } from '../../../../services/util.service';
import { ApiService } from '../../../../services/api.service';
import { KanbanService } from '../../../../services/kanban.service';
import { TransactionDetailModal } from '../../modals/transaction-detail/transaction-detail.modal';
import { TransactionDetailModal2 } from '../../modals/transaction-detail2/transaction-detail2.modal';

@Component({
    selector: 'app-transaction-history',
    templateUrl: './transaction-history.component.html',
    styleUrls: ['./transaction-history.component.css']
})
export class TransactionHistoryComponent implements OnInit {
    @ViewChild('transactionDetailModal', { static: true }) transactionDetailModal: TransactionDetailModal;
    @ViewChild('transactionDetailModal2', { static: true }) transactionDetailModal2: TransactionDetailModal2;
    transactionHistory: TransactionItem[];
    @Input() coinsPrice: CoinsPrice;
    @Input() walletId: string;
    @Input() transactions: any;
    currentType: string;
    utilServ: UtilService;

    constructor(
        private storageService: StorageService,
        private apiServ: ApiService,
        utilServ: UtilService,
        private kanbanServ: KanbanService
    ) {
        this.utilServ = utilServ;
    }

    changeType(type: string) {
        this.currentType = type;
    }

    ngOnInit() {
        this.currentType = 'All';
        this.storageService.getTransactionHistoryList().subscribe(
            (transactionHistory: TransactionItem[]) => {
                console.log('transactionHistory=', transactionHistory);
                if (transactionHistory) {
                    this.transactionHistory = transactionHistory.reverse().filter(s => s.walletId === this.walletId);
                }
            }
        );
    }

    async showTransactionDetail2(item: any) {
        this.transactionDetailModal2.show(item);
    }

    async showTransactionDetail(item: TransactionItem) {
        console.log('item is:', item);
        if (item.type === 'Withdraw') {
            const status = await this.kanbanServ.getTransactionStatus(item.txid);
            item.confirmations = status;
        } else
            if (item.type === 'Deposit') {
                const status = await this.kanbanServ.getDepositStatus(item.txid);
                item.confirmations = status;
            } else
                if (item.coin === 'BTC') {
                    const tx = await this.apiServ.getBtcTransaction(item.txid);
                    item.confirmations = tx.confirmations;
                    item.blockhash = tx.blockhash;
                } else
                    if (item.coin === 'ETH' || item.tokenType === 'ETH') {
                        const tx = await this.apiServ.getEthTransaction(item.txid);
                        item.confirmations = '0';
                        if (tx.blockNumber) {
                            item.confirmations = tx.confirmations;
                        }
                        item.blockhash = tx.blockHash;
                    } else
                        if (item.coin === 'FAB' || item.tokenType === 'FAB') {
                            const tx = await this.apiServ.getFabTransactionJson(item.txid);
                            console.log('tx in fab token:', tx);
                            item.confirmations = '0';
                            if (tx.confirmations) {
                                item.confirmations = tx.confirmations.toString();
                            }
                            item.blockhash = tx.blockhash;
                        }
        this.transactionDetailModal.show(item);
    }
}
