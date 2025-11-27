# Backend setup

## Kurulum
1. Depoyu klonladıktan sonra bağımlılıkları kurun:
   ```bash
   npm install
   ```
2. `.env` dosyasını oluşturun ve `.env.example` içeriğini kopyalayın. Varsayılan veritabanı adı `ecommerce_cs308` olarak ayarlı.
3. PostgreSQL'de `ecommerce_cs308` ve testler için `ecommerce_cs308_test` veritabanlarını oluşturun.

## Veritabanı yönetimi
- Migrasyonları çalıştırmak için:
  ```bash
  npm run db:migrate
  ```
- Seed verisini yüklemek için:
  ```bash
  npm run db:seed
  ```
- Tüm veriyi sıfırlayıp migrasyon + seed akışını yeniden çalıştırmak için:
  ```bash
  npm run db:reset
  ```

## Testler
`npm test` komutu test ortamında (`NODE_ENV=test`) önce rollback + migrate + seed çalıştırır ve ardından Jest testlerini yürütür.