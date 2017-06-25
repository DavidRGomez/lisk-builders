const axios = require('axios');
const delegates = require('../data/delegates.json');

const freelancers = delegates.filter(dg => dg.affiliation === 'Freelance');

const candidates = {};

const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
};

const getDelegateData = delegate =>
    axios.get(`https://node02.lisk.io/api/delegates/get?username=${delegate.delegateName}`)
        .then(res => {
                return axios.get(`https://node02.lisk.io/api/delegates/voters?publicKey=${res.data.delegate.publicKey}`)
                .then(res2 => {
                  delegate.voters = res2.data.accounts ? res2.data.accounts : undefined
                  return delegate;
                });
        })
        .catch(res => delegate);

const lotto = (entries) => {
  const totalTickets = entries.reduce((mem, val) => mem + val.tickets, 0);
  const avgTickets = Math.floor(totalTickets / entries.length);
  console.log('Total Tickets: ' + totalTickets);
  console.log('Average Tickets: ' + avgTickets);
  const avgEntries = entries.map(acc => {
    acc.tickets = Math.min(acc.tickets, avgTickets);
    return acc;
  });
  const finalTotalTickets = avgEntries.reduce((mem, val) => mem + val.tickets, 0);
  console.log('Final Total Tickets: ' + finalTotalTickets);
  console.log('Entries:');
  console.log(avgEntries);
  const lotto = [];
  avgEntries.forEach((entry, index) => {
    for (let i = 0; i < entry.tickets; i++) {
      lotto.push(index);
    }
  });
  const winnerId = Math.floor(getRandomArbitrary(0, lotto.length));
  console.log('Winner: ' + JSON.stringify(entries[lotto[winnerId]]));
};

axios
    .all(freelancers.map(getDelegateData))
    .then((res) => {
      res.forEach(dg => {
        dg.voters.forEach(vt => {
          if (!candidates[vt.address]) {
            candidates[vt.address] = 1;
          } else {
            candidates[vt.address] += 1;
          }
        });
      });
      const validCandidates = Object.keys(candidates).filter(key => candidates[key] === freelancers.length);
      Promise.all(validCandidates.map(vc => {
        return axios.get(`https://node02.lisk.io/api/accounts/getBalance?address=${vc}`).then(res2 => {
          return { account: vc, tickets: Math.floor((res2.data.balance ? res2.data.balance : 0) / 100000000) };
        });
      })).then(lotto).catch(err => console.log(err));
    });