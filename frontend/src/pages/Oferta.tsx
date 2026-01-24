import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Oferta = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <article className="prose prose-invert prose-headings:font-display max-w-none">
            <h1 className="text-3xl md:text-4xl font-display text-center mb-8">
              Публичная оферта
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
                1.1. Настоящий документ является официальным предложением (публичной офертой) ИП Орлов Леонид Андреевич (далее — «Продавец») и содержит все существенные условия продажи ювелирных изделий из серебра, изготавливаемых по индивидуальному заказу (далее — «Товар»).
              </p>
              <p className="text-muted-foreground">
                1.2. В соответствии со статьёй 437 Гражданского кодекса РФ данный документ является публичной офертой, адресованной физическим лицам (далее — «Покупатель»).
              </p>
              <p className="text-muted-foreground">
                1.3. Акцептом оферты является оформление заказа и внесение предоплаты. С момента акцепта оферта считается заключённым договором.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">2. Предмет договора</h2>
              <p className="text-muted-foreground">
                2.1. Продавец обязуется изготовить и передать Покупателю Товар — ювелирные изделия из серебра 925 пробы, изготовленные по индивидуальному заказу на основе 3D-модели лица Покупателя или указанного им лица.
              </p>
              <p className="text-muted-foreground">
                2.2. Покупатель обязуется оплатить и принять Товар на условиях настоящей оферты.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">3. Оформление заказа</h2>
              <p className="text-muted-foreground">
                3.1. Заказ оформляется через сайт olai.art или через Telegram: @olai_support.
              </p>
              <p className="text-muted-foreground">
                3.2. Для оформления заказа Покупатель предоставляет:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>фотографии или видео лица для создания 3D-модели;</li>
                <li>контактные данные для связи;</li>
                <li>адрес доставки.</li>
              </ul>
              <p className="text-muted-foreground">
                3.3. После согласования деталей заказа Покупателю направляется счёт на предоплату.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">4. Цена и порядок оплаты</h2>
              <p className="text-muted-foreground">
                4.1. Стоимость Товара рассчитывается индивидуально и зависит от размера изделия и сложности заказа. Актуальные базовые цены указаны на сайте olai.art.
              </p>
              <p className="text-muted-foreground">
                4.2. Порядок оплаты:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>50% — предоплата после согласования заказа;</li>
                <li>50% — после утверждения Покупателем фото и видео готового изделия, перед отправкой.</li>
              </ul>
              <p className="text-muted-foreground">
                4.3. Способы оплаты: банковская карта, СБП (Система быстрых платежей).
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">5. Сроки изготовления и доставка</h2>
              <p className="text-muted-foreground">
                5.1. Срок изготовления Товара — до 14 рабочих дней с момента получения предоплаты и всех необходимых материалов от Покупателя.
              </p>
              <p className="text-muted-foreground">
                5.2. Доставка осуществляется службой СДЭК по всей территории Российской Федерации.
              </p>
              <p className="text-muted-foreground">
                5.3. Сроки доставки: от 1 до 7 рабочих дней в зависимости от региона.
              </p>
              <p className="text-muted-foreground">
                5.4. Стоимость доставки рассчитывается отдельно и сообщается Покупателю при оформлении заказа.
              </p>
              <p className="text-muted-foreground">
                5.5. Перед отправкой Покупателю направляются фотографии и видео готового изделия для утверждения.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">6. Возврат и обмен</h2>
              <p className="text-muted-foreground">
                6.1. Товар изготавливается по индивидуальному заказу и имеет индивидуально-определённые свойства. В соответствии с Постановлением Правительства РФ № 2463 от 31.12.2020 такой товар не подлежит возврату или обмену надлежащего качества.
              </p>
              <p className="text-muted-foreground">
                6.2. Возврат Товара возможен в случае обнаружения производственного брака. Для этого Покупатель должен:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>связаться с Продавцом в течение 7 дней с момента получения Товара;</li>
                <li>предоставить фото или видео, подтверждающие наличие брака;</li>
                <li>направить Товар Продавцу для экспертизы (за счёт Продавца).</li>
              </ul>
              <p className="text-muted-foreground">
                6.3. При подтверждении брака Продавец по выбору Покупателя:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>устраняет недостатки за свой счёт;</li>
                <li>изготавливает новое изделие;</li>
                <li>возвращает полную стоимость Товара.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">7. Ответственность сторон</h2>
              <p className="text-muted-foreground">
                7.1. Продавец не несёт ответственности за задержки доставки, связанные с работой службы доставки.
              </p>
              <p className="text-muted-foreground">
                7.2. Продавец гарантирует соответствие изделия согласованному макету и пробу серебра 925.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">8. Порядок разрешения споров</h2>
              <p className="text-muted-foreground">
                8.1. Все споры разрешаются путём переговоров. Претензии направляются на email: help@olai.art.
              </p>
              <p className="text-muted-foreground">
                8.2. Срок рассмотрения претензии — 10 рабочих дней.
              </p>
              <p className="text-muted-foreground">
                8.3. При невозможности урегулирования спора он подлежит рассмотрению в суде по месту нахождения Продавца.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-6">
              <h2 className="text-xl font-display">9. Прочие условия</h2>
              <p className="text-muted-foreground">
                9.1. Продавец оставляет за собой право вносить изменения в настоящую оферту. Изменения вступают в силу с момента публикации на сайте.
              </p>
              <p className="text-muted-foreground">
                9.2. Покупатель подтверждает, что ознакомлен и согласен с условиями настоящей оферты до момента оформления заказа.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="text-center space-y-2">
              <h2 className="text-xl font-display">Реквизиты Продавца</h2>
              <p className="text-muted-foreground">ИП Орлов Леонид Андреевич</p>
              <p className="text-muted-foreground">ИНН: 662342643820</p>
              <p className="text-muted-foreground">ОГРНИП: 319665800217251</p>
              <p className="text-muted-foreground">Email: help@olai.art</p>
              <p className="text-muted-foreground">Telegram: @olai_support</p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Oferta;
