# Fatura Yönetim Sistemi (Invoice Management System)

Bu proje, şirketlerin müşteri ve fatura süreçlerini yönetebilmesi için geliştirilmekte olan tam kapsamlı bir web uygulamasıdır. 

## 🏗️ Sistem Mimarisi

Proje, modern web standartlarına uygun olarak iki ana katmandan oluşmaktadır:
*   **Frontend:** Next.js kullanılarak geliştirilen, kullanıcı dostu arayüz.
*   **Backend:** REST API standartlarına uygun, Python tabanlı modüler backend mimarisi.
*   **Veritabanı:** İlişkisel veri modellemesi (RDBMS) ile tasarlanmış SQL veritabanı.

## 🗄️ Veritabanı Şeması
Sistem 4 temel tablodan oluşmaktadır:
1.  `Users`: Sistem kullanıcıları.
2.  `Customer`: Müşteri cari kartları.
3.  `Invoice`: Fatura üst bilgileri.
4.  `InvoiceLine`: Fatura detay/kalem bilgileri.