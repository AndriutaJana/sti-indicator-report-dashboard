const ldap = require('ldapjs');
require('dotenv').config();

const ldapConfig = {
  url: process.env.LDAP_URL,
  bindDN: process.env.LDAP_BIND_DN,
  bindPassword: process.env.LDAP_BIND_PASSWORD,
  searchBase: process.env.LDAP_SEARCH_BASE,
  roleGroupDN: process.env.LDAP_ROLE_GROUP,
};

class LDAPService {
  static async authenticate(username, password) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: ldapConfig.url,
        timeout: 10000,
        connectTimeout: 10000,
        reconnect: true,
        referrals: {
          enabled: true,
          hopLimit: 5,
        },
      });

      console.log(`Încerc bind cu service account: ${ldapConfig.bindDN}`);

      client.bind(ldapConfig.bindDN, ldapConfig.bindPassword, (err) => {
        if (err) {
          client.unbind();
          return reject(new Error('Eroare conectare LDAP (service bind)'));
        }

        const searchFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@mai.gov.md)))`;
        console.log(`Caut utilizator cu: ${searchFilter}`);

        client.search(ldapConfig.searchBase, {
          filter: searchFilter,
          scope: 'sub',
          attributes: ['dn', 'mail', 'memberOf'],
        }, (err, res) => {
          if (err) {
            client.unbind();
            return reject(new Error('Eroare căutare utilizator LDAP'));
          }

          let userFound = false;

          res.on('searchEntry', (entry) => {
            userFound = true;
            const userDn = entry.dn.toString();

            // Extrage atributele într-un obiect simplu
            const attributes = entry.attributes.reduce((acc, attr) => {
              acc[attr.type] = attr.values;
              return acc;
            }, {});

              client.bind(userDn, password, (err) => {
              if (err) {
                client.unbind();
                return reject(new Error('Date de autentificare invalide'));
              }

              const memberOf = attributes.memberOf || [];
              const email = attributes.mail?.[0] || `${username}@mai.gov.md`;
              
              // Проверка конкретной роли "Nota"
              const notaRoleDN = 'CN=Nota,OU=Roles,DC=MAI,DC=MAI';
              const isAuthorized = memberOf.includes(notaRoleDN);

              if (!isAuthorized) {
                client.unbind();
                return reject(new Error('Nu aveți drepturile necesare'));
              }

              client.unbind();
              resolve({
                username,
                email,
                isAuthorized: true,
              });
            });
          });

          res.on('error', (err) => {
            client.unbind();
            reject(new Error('Eroare în timpul căutării LDAP'));
          });

          res.on('end', () => {
            if (!userFound) {
              client.unbind();
              reject(new Error('Utilizator LDAP nu a fost găsit'));
            }
          });
        });
      });
    });
  }
}

module.exports = LDAPService;
