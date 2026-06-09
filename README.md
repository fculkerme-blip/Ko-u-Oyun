# Renkli Çarpım Koşusu

GitHub Pages üzerinde doğrudan çalışabilecek, statik HTML/CSS/JavaScript ile hazırlanmış çarpım tablosu koşu oyunu.

## Özellikler

- 1–12 arası çarpım tabloları seçilebilir.
- Doğru cevap kapısı, yanlış cevap kapısı.
- Aynı renkte karakterler büyütür, farklı renkte karakterler küçültür.
- Renkli duvarlar oyuncunun rengini değiştirir ve boyunu azaltır.
- Coin toplama ve 27 şapkalı mağaza sistemi.
- Klavye, mouse sürükleme ve dokunmatik kontroller.
- `localStorage` ile coin, seviye ve şapka kaydı.
- Dış bağımlılık yoktur; assetsiz çalışır.

## GitHub Pages'e yükleme

1. Bu klasördeki `index.html`, `style.css` ve `game.js` dosyalarını bir GitHub reposuna yükleyin.
2. GitHub reposunda **Settings → Pages** bölümüne girin.
3. **Deploy from a branch** seçin.
4. Branch olarak `main`, klasör olarak `/root` seçin ve kaydedin.
5. GitHub size birkaç dakika içinde bir Pages URL'si verecektir.

## Yerelde çalıştırma

Dosyayı doğrudan açabilirsiniz veya küçük bir sunucu ile çalıştırabilirsiniz:

```bash
python3 -m http.server 8080
```

Ardından tarayıcıda `http://localhost:8080` adresini açın.
