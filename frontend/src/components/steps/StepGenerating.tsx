import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig, UserAuthData } from "@/types/pendant";
import { useFormFactors } from "@/contexts/SettingsContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { EmailAuthForm } from "@/components/EmailAuthForm";

const funFacts = [
  // История ювелирного дела
  "Первые ювелирные украшения появились более 100 000 лет назад — это были ракушки с отверстиями",
  "Древние египтяне верили, что золото — это плоть богов, а серебро — их кости",
  "Клеопатра носила украшения из изумрудов, которые добывались в её собственных шахтах",
  "В Древнем Риме только определённые сословия имели право носить золотые кольца",
  "Первые обручальные кольца появились в Древнем Египте около 4800 лет назад",
  "В средневековой Европе законы запрещали простолюдинам носить жемчуг",
  "Корона Российской империи содержит 4936 бриллиантов и огромную красную шпинель",
  "Легендарное ожерелье Марии-Антуанетты стало причиной грандиозного скандала во Франции",
  "Древние кельты верили, что серебро защищает от злых духов",
  "В Японии самураи носили украшения с изображением своего герба — мона",

  // Серебро
  "Серебро обладает антибактериальными свойствами и использовалось в медицине веками",
  "Серебро 925 пробы содержит 92.5% чистого серебра и 7.5% меди для прочности",
  "Слово «серебро» происходит от ассирийского «сарпу» — светлый металл",
  "Серебро — лучший проводник электричества среди всех металлов",
  "В древности серебро ценилось дороже золота в некоторых культурах",
  "Серебряные украшения темнеют из-за реакции с серой в воздухе",
  "Чистое серебро слишком мягкое — его нельзя использовать в украшениях",
  "Крупнейший самородок серебра весил 1420 кг и был найден в Мексике",
  "Серебро используется в солнечных панелях и электронике",
  "Родирование серебра делает его более блестящим и защищает от потемнения",

  // Золото
  "Всё добытое за историю человечества золото поместилось бы в куб со стороной 21 метр",
  "Золото настолько пластично, что из 1 грамма можно вытянуть проволоку длиной 3 км",
  "Золото не окисляется и не тускнеет даже за тысячи лет",
  "В человеческом теле содержится около 0.2 мг золота",
  "Самый большой золотой самородок «Желанный незнакомец» весил 72 кг",
  "Олимпийские золотые медали на самом деле покрыты всего 6 граммами золота",
  "Золото можно раскатать настолько тонко, что оно станет полупрозрачным",
  "585 проба золота означает, что в сплаве 58.5% чистого золота",
  "Белое золото получают добавлением палладия или никеля",
  "Розовое золото содержит больше меди в сплаве",

  // Драгоценные камни
  "Бриллианты — единственный драгоценный камень, состоящий из одного элемента: углерода",
  "Самый крупный бриллиант «Куллинан» весил 3106 карат до огранки",
  "Рубин и сапфир — это один минерал (корунд), различающийся только цветом",
  "Александрит меняет цвет с зелёного на красный при разном освещении",
  "Жемчуг — единственный драгоценный камень, создаваемый живым организмом",
  "Изумруды часто имеют включения, которые ювелиры называют «садом»",
  "Опал содержит до 20% воды и может высохнуть и потрескаться",
  "Танзанит добывается только в одном месте на Земле — у подножия Килиманджаро",
  "Бирюза — один из первых камней, используемых в украшениях (более 7000 лет)",
  "Янтарь — это окаменевшая смола древних деревьев возрастом до 100 млн лет",

  // Технологии
  "3D-печать ювелирных изделий позволяет создавать формы, невозможные при традиционных методах",
  "Техника литья по выплавляемым моделям используется уже более 5000 лет",
  "Современные ювелиры используют лазеры для гравировки с точностью до 0.01мм",
  "CAD-моделирование позволяет увидеть украшение ещё до его создания",
  "3D-принтеры для ювелирки печатают воском, который затем выплавляется",
  "Лазерная сварка позволяет ремонтировать украшения рядом с камнями без их повреждения",
  "Современные полировальные машины работают на скорости до 3000 оборотов в минуту",
  "Гальванопластика позволяет покрывать украшения тончайшим слоем драгметаллов",
  "Ультразвуковая очистка удаляет загрязнения из самых труднодоступных мест",
  "Спектрометры помогают определить подлинность камней и металлов",

  // Процесс создания
  "Каждое украшение проходит до 20 этапов обработки прежде чем попасть к владельцу",
  "Полировка одного кольца вручную занимает около 30 минут",
  "Закрепка одного бриллианта требует от ювелира работы под 10-кратным увеличением",
  "Температура плавления золота — 1064°C, серебра — 961°C",
  "Ювелиры используют специальную «третью руку» — приспособление для фиксации изделий",
  "Восковая модель для литья создаётся с учётом усадки металла при остывании",
  "Литьевой воск плавится при температуре около 70°C",
  "После литья украшение «отбеливают» в кислотном растворе",
  "Матовую поверхность создают пескоструйной обработкой",
  "Черненное серебро получают с помощью серной печени — соединения серы и калия",

  // Интересные факты
  "Самый большой серебряный кулон весил более 5 кг и был создан в Индии",
  "Среднее обручальное кольцо переплавляется и переделывается 2-3 раза за жизнь",
  "Ювелирное дело — одна из древнейших профессий человечества",
  "В мире существует более 130 различных огранок для бриллиантов",
  "Классическая огранка «бриллиант» имеет 57 граней",
  "Карат как мера веса произошёл от семян рожкового дерева",
  "1 карат = 0.2 грамма",
  "Платина была открыта конкистадорами, но считалась «бесполезным» металлом",
  "Тиффани изобрела современную шестизубцовую оправу для бриллиантов в 1886 году",
  "Первые наручные часы были ювелирным украшением для женщин",

  // Символика
  "Кольцо на безымянном пальце носят из-за древнего поверья о «вене любви»",
  "Кладдахское кольцо символизирует любовь, дружбу и верность",
  "Подкова в украшениях — символ удачи и защиты",
  "Якорь символизирует надежду и стабильность",
  "Бесконечность — один из самых популярных символов в современных украшениях",
  "Сердце как символ любви в украшениях появилось только в XV веке",
  "Змея, кусающая свой хвост (уроборос) — символ вечности",
  "Крест стал популярным украшением после принятия христианства",
  "Звезда Давида как украшение появилась только в XIX веке",
  "Дерево жизни — древний символ, встречающийся во всех культурах",

  // Уход за украшениями
  "Серебро лучше хранить в тканевых мешочках, защищающих от воздуха",
  "Жемчуг нельзя чистить в ультразвуковой ванне — он может разрушиться",
  "Духи и кремы лучше наносить до надевания украшений",
  "Серебро можно почистить зубной пастой или содой",
  "Золото достаточно промывать тёплой мыльной водой",
  "Украшения с камнями нельзя подвергать резким перепадам температуры",
  "Хлорированная вода в бассейне может повредить золотые украшения",
  "Изумруды часто обрабатывают маслом — их нельзя чистить паром",
  "Серебро темнеет быстрее в помещениях с высокой влажностью",
  "Профессиональную чистку украшений рекомендуется делать раз в год",

  // Рекорды и курьёзы
  "Самое дорогое украшение в мире — колье L'Incomparable стоимостью $55 млн",
  "Кольцо «Надежда» с голубым бриллиантом считается проклятым",
  "Самый маленький бриллиант весит 0.0003 карата",
  "В фильме «Титаник» использовалась копия знаменитого «Сердца океана»",
  "Королева Елизавета II владела коллекцией украшений стоимостью более $500 млн",
  "Самая длинная золотая цепочка — 5 км, создана в Дубае",
  "Существуют украшения из метеоритного железа возрастом миллиарды лет",
  "В Японии создали кольцо с бриллиантом размером 0.1 мм",
  "Самые древние золотые украшения найдены в Болгарии (4600 г. до н.э.)",
  "Бриллиант «Кохинор» сменил как минимум 7 владельцев-правителей",
];

interface StepGeneratingProps {
  config: PendantConfig;
  applicationId: string;
  onGenerationComplete: (images: string[], thumbnails: string[], userAuth?: UserAuthData) => void;
  onGenerationError: (error: string) => void;
  objectDescription?: string;  // For custom 3D form generation
  theme?: string;  // Theme for generation
}

export function StepGenerating({
  config,
  applicationId,
  onGenerationComplete,
  onGenerationError,
  objectDescription,
  theme,
}: StepGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const { toast } = useToast();

  const estimatedTime = 60; // seconds

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Check various fields that indicate logged in state
          // Auth.tsx uses 'verified', EmailAuthForm uses 'isVerified'
          if (user.isVerified || user.verified || user.userId || user.id) {
            setIsUserAuthenticated(true);
            return;
          }
        } catch {
          // ignore
        }
      }
      setIsUserAuthenticated(false);
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (login from header)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Handle auth success
  const handleAuthSuccess = (userData: UserAuthData) => {
    setIsUserAuthenticated(true);

    // If generation is already done, proceed immediately
    if (generationDone && generatedImages.length > 0) {
      toast({
        title: "Отлично!",
        description: "Теперь выберите понравившийся вариант",
      });
      onGenerationComplete(generatedImages, generatedThumbnails, userData);
    }
  };

  // When generation is done and user is authenticated, proceed
  useEffect(() => {
    if (generationDone && generatedImages.length > 0 && isUserAuthenticated) {
      // Get user data from localStorage
      const storedUser = localStorage.getItem('user');
      let userData: UserAuthData | undefined;

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userData = {
            email: user.email,
            name: user.name || '',
            userId: user.userId || user.id,
            isVerified: true,
            firstName: user.firstName,
            lastName: user.lastName,
            telegramUsername: user.telegramUsername,
            subscribeNewsletter: user.subscribeNewsletter
          };
        } catch {
          // ignore
        }
      }

      onGenerationComplete(generatedImages, generatedThumbnails, userData);
    }
  }, [generationDone, generatedImages, generatedThumbnails, isUserAuthenticated]);

  // Start generation on mount
  useEffect(() => {
    if (isGenerating) return;

    const runGeneration = async () => {
      setIsGenerating(true);

      try {
        console.log("Starting pendant generation...");

        // Update status to generating
        await api.updateApplication(applicationId, { status: "generating" });

        const { data, error } = await api.generate({
          imageBase64: config.imagePreview,
          prompt: config.comment,
          formFactor: config.formFactor,
          size: config.size,
          material: config.material,
          applicationId: applicationId,
          theme: theme || 'main',
          objectDescription: objectDescription,  // For custom 3D form
        });

        if (error) {
          console.error("Generation error:", error);
          throw new Error(error.toString());
        }

        if (!data.success) {
          throw new Error(data.error || "Generation failed");
        }

        console.log("Generation successful:", data.images?.length, "images");

        // Update application with generated preview
        if (data.images && data.images.length > 0) {
          await api.updateApplication(applicationId, {
            generated_preview: data.images[0],
            status: "generated",
          });
        }

        setProgress(100);
        setGeneratedImages(data.images || []);
        // Use thumbnails from API, fallback to full images if not available
        setGeneratedThumbnails(data.thumbnails || data.images || []);
        setGenerationDone(true);

        toast({
          title: "Готово!",
          description: `Сгенерировано ${data.images?.length || 1} вариантов`,
        });

      } catch (error) {
        console.error("Generation error:", error);

        // Update status back to draft on error
        await api.updateApplication(applicationId, { status: "draft" });

        toast({
          title: "Ошибка генерации",
          description:
            error instanceof Error ? error.message : "Попробуйте еще раз",
          variant: "destructive",
        });

        onGenerationError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    runGeneration();
  }, [applicationId]);

  // Progress animation
  useEffect(() => {
    if (generationDone) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Non-linear progress that slows down as it approaches 95%
        const increment = Math.max(0.5, (95 - prev) / 50);
        return Math.min(prev + increment, 95);
      });
    }, 600);

    return () => clearInterval(interval);
  }, [generationDone]);

  // Fun facts rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formFactors = useFormFactors();
  const { config: themeConfig } = useAppTheme();
  const formFactorConfig = formFactors[config.formFactor];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-fade-in">
      {/* Uploaded image preview */}
      {config.imagePreview && (
        <div className="relative">
          <div
            className="absolute inset-0 blur-2xl rounded-full"
            style={{ backgroundColor: `${themeConfig.accentColor}20` }}
          />
          <div
            className="relative w-48 h-48 rounded-xl overflow-hidden bg-card"
            style={{ borderWidth: 2, borderColor: `${themeConfig.accentColor}50` }}
          >
            <img
              src={config.imagePreview}
              alt="Ваше изображение"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Overlay with pulse animation */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </div>
      )}

      {/* Loading animation */}
      <div className="text-center space-y-6">
        <div className="relative">
          <Sparkles
            className="w-16 h-16 animate-pulse mx-auto"
            style={{ color: themeConfig.accentColor }}
          />
          <div
            className="absolute inset-0 blur-xl rounded-full animate-pulse"
            style={{ backgroundColor: `${themeConfig.accentColor}30` }}
          />
        </div>

        <div className="space-y-2">
          <h2
            className={`text-2xl md:text-3xl font-display ${themeConfig.textGradientClass}`}
          >
            {generationDone
              ? (isUserAuthenticated ? "Варианты готовы!" : "Осталось только авторизоваться")
              : "Создаём варианты вашего украшения..."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formFactorConfig?.label || config.formFactor}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 md:w-80 mx-auto space-y-2">
          <Progress
            value={progress}
            className="h-2"
            style={{
              // @ts-ignore - CSS variable for progress indicator color
              "--progress-color": themeConfig.accentColor
            } as React.CSSProperties}
          />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% завершено
          </p>
        </div>
      </div>

      {/* Email Auth form - show if not authenticated */}
      {!isUserAuthenticated && (
        <div className="w-full max-w-sm bg-card/50 rounded-xl border border-border/50">
          <div className="text-center pt-4 px-4">
            <p className="text-sm font-medium" style={{ color: themeConfig.accentColorLight }}>
              {generationDone ? "Войдите чтобы увидеть результат" : "Сохраните ваши эскизы"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Так мы не потеряем ваши рисунки и сможем связаться с вами
            </p>
          </div>

          <EmailAuthForm
            mode="inline"
            applicationId={applicationId}
            onSuccess={handleAuthSuccess}
            showMotivation={false}
          />
        </div>
      )}

      {/* Already authenticated message */}
      {isUserAuthenticated && !generationDone && (
        <div className="w-full max-w-sm p-4 bg-card/50 rounded-xl border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Вы авторизованы. Дождитесь завершения генерации...
          </p>
        </div>
      )}

      {/* Fun facts - only while generating */}
      {!generationDone && (
        <div className="max-w-md p-4 bg-card/50 rounded-xl border border-border/50">
          <p
            className="text-sm font-medium mb-2"
            style={{ color: themeConfig.accentColorLight }}
          >
            А вы знали?
          </p>
          <p
            className="text-sm text-muted-foreground animate-fade-in"
            key={currentFactIndex}
          >
            {funFacts[currentFactIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
