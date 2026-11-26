export const statusBadge = (st: string) =>
  st === 'delivered' ? 'b-green' : st === 'paid' ? 'b-green' : st === 'cancelled' ? 'b-red' : st === 'shipping' ? 'b-blue' : st === 'preparing' ? 'b-gold' : st === 'awaiting_quote' ? 'b-grey' : 'b-orange';
export const payBadge = (st: string) => (st === 'paid' ? 'b-green' : st === 'failed' ? 'b-red' : st === 'pending' ? 'b-gold' : 'b-orange');
