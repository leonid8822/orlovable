import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <article className="prose prose-invert prose-headings:font-display max-w-none">
            <h1 className="text-3xl md:text-4xl font-display text-center mb-8">
              Политика конфиденциальности
            </h1>

            <div className="text-center text-muted-foreground mb-8">
              <p className="font-medium">ИП Орлов Леонид Андреевич</p>
              <p>ИНН: 662342643820</p>
              <p>ОГРНИП: 319665800217251</p>
              <p>Email: help@olai.art</p>
              <p className="mt-4 text-sm">Дата публикации: 24 января 2026 г.</p>
            </div>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">1. Общие положения</h2>
              <p className="text-muted-foreground">
                1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных пользователей сайта olai.art (далее — «Сайт»).
              </p>
              <p className="text-muted-foreground">
                1.2. Оператором персональных данных является ИП Орлов Леонид Андреевич (далее — «Оператор»).
              </p>
              <p className="text-muted-foreground">
                1.3. Используя Сайт и предоставляя свои персональные данные, Пользователь выражает согласие с условиями настоящей Политики.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">2. Какие данные мы собираем</h2>
              <p className="text-muted-foreground">
                2.1. Оператор может собирать следующие персональные данные:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>имя, фамилия;</li>
                <li>номер телефона;</li>
                <li>адрес электронной почты;</li>
                <li>адрес доставки;</li>
                <li>фотографии и видео лица (для создания 3D-модели изделия).</li>
              </ul>
              <p className="text-muted-foreground">
                2.2. Технические данные:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>IP-адрес;</li>
                <li>данные cookies;</li>
                <li>информация о браузере и устройстве.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">3. Цели обработки данных</h2>
              <p className="text-muted-foreground">
                3.1. Персональные данные обрабатываются в следующих целях:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>оформление и выполнение заказов;</li>
                <li>изготовление ювелирных изделий по индивидуальному заказу;</li>
                <li>связь с Пользователем по вопросам заказа;</li>
                <li>доставка Товара;</li>
                <li>улучшение качества обслуживания и работы Сайта.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">4. Правовые основания обработки</h2>
              <p className="text-muted-foreground">
                4.1. Обработка персональных данных осуществляется на основании:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>согласия Пользователя (ст. 6 ч. 1 п. 1 Федерального закона № 152-ФЗ «О персональных данных»);</li>
                <li>исполнения договора (публичной оферты), стороной которого является Пользователь.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">5. Передача данных третьим лицам</h2>
              <p className="text-muted-foreground">
                5.1. Оператор может передавать персональные данные:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>службам доставки (СДЭК) — для осуществления доставки заказа;</li>
                <li>платёжным системам — для обработки оплаты.</li>
              </ul>
              <p className="text-muted-foreground">
                5.2. Оператор не продаёт и не передаёт персональные данные третьим лицам в маркетинговых целях.
              </p>
              <p className="text-muted-foreground">
                5.3. Оператор может раскрыть персональные данные по требованию уполномоченных государственных органов в случаях, предусмотренных законодательством РФ.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">6. Защита данных</h2>
              <p className="text-muted-foreground">
                6.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования и распространения.
              </p>
              <p className="text-muted-foreground">
                6.2. Фотографии и видео лица, предоставленные для создания изделия, хранятся в защищённом виде и используются исключительно для выполнения заказа.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">7. Сроки хранения данных</h2>
              <p className="text-muted-foreground">
                7.1. Персональные данные хранятся в течение срока, необходимого для выполнения заказа и соблюдения требований законодательства.
              </p>
              <p className="text-muted-foreground">
                7.2. Фотографии и видео лица удаляются по запросу Пользователя после выполнения заказа или автоматически через 6 месяцев после завершения заказа.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">8. Права Пользователя</h2>
              <p className="text-muted-foreground">
                8.1. Пользователь имеет право:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>получить информацию о своих персональных данных;</li>
                <li>требовать уточнения, блокирования или удаления персональных данных;</li>
                <li>отозвать согласие на обработку персональных данных.</li>
              </ul>
              <p className="text-muted-foreground">
                8.2. Для реализации указанных прав необходимо направить запрос на email: help@olai.art.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">9. Cookies</h2>
              <p className="text-muted-foreground">
                9.1. Сайт использует файлы cookies для улучшения работы и анализа посещаемости.
              </p>
              <p className="text-muted-foreground">
                9.2. Пользователь может отключить cookies в настройках браузера, однако это может повлиять на функциональность Сайта.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">10. Изменения в Политике</h2>
              <p className="text-muted-foreground">
                10.1. Оператор оставляет за собой право вносить изменения в настоящую Политику.
              </p>
              <p className="text-muted-foreground">
                10.2. Новая редакция Политики вступает в силу с момента публикации на Сайте.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">11. Контакты</h2>
              <p className="text-muted-foreground">
                По вопросам обработки персональных данных обращайтесь:
              </p>
              <p className="text-muted-foreground">
                Email: help@olai.art
              </p>
              <p className="text-muted-foreground">
                Telegram: @olai_support
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="text-center space-y-2">
              <h2 className="text-xl font-display">Реквизиты Оператора</h2>
              <p className="text-muted-foreground">ИП Орлов Леонид Андреевич</p>
              <p className="text-muted-foreground">ИНН: 662342643820</p>
              <p className="text-muted-foreground">ОГРНИП: 319665800217251</p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
