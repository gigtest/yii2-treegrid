<?php

namespace Ja_D0\treegrid;

use Closure;
use Ja_D0\treegrid\columns\TreeColumn;
use Yii;
use yii\base\InvalidConfigException;
use yii\base\Widget;
use yii\grid\DataColumn;
use yii\helpers\ArrayHelper;
use yii\helpers\Html;
use yii\helpers\Json;
use yii\i18n\Formatter;
use yii\web\JsExpression;

/**
 * TreeGrid renders a jQuery TreeGrid component.
 * The code was based in: https://github.com/yiisoft/yii2/blob/master/framework/grid/GridView.php
 *
 * @see https://github.com/maxazan/jquery-treegrid
 * @author Leandro Gehlen <leandrogehlen@gmail.com>
 */
class TreeGrid extends Widget
{
    /**
     * Определяет положение поля поиска справа в строке свободного пространства
     */
    const SEARCH_POSITION_RIGHT = 'right';

    /**
     * Определяет положение поля поиска слева в строке свободного пространства
     */
    const SEARCH_POSITION_LEFT = 'left';

    /**
     * @var \yii\data\DataProviderInterface|\yii\data\BaseDataProvider the data provider for the view. This property is required.
     */
    public $dataProvider;

    /**
     * @var string the default data column class if the class name is not explicitly specified when configuring a data column.
     * Defaults to 'leandrogehlen\treegrid\TreeColumn'.
     */
    public $dataColumnClass;

    /**
     * @var array атрибуты HTML для тега виджета
     */
    public $options = ['class' => 'treegrid'];

    /**
     * @var string|Closure|boolean элементы свободного пространства
     */
    public $containerSpace = false;

    /**
     * @var array the HTML attributes for the table tag of the grid view.
     * @see \yii\helpers\Html::renderTagAttributes() for details on how attributes are being rendered.
     */
    public $tableOptions = ['class' => 'table table-bordered col-sm-12'];

    /**
     * @var array аттрибуты HTML для тега контейнера таблицы дерева
     */
    public $tableContainerOptions = [];

    /**
     * @var array дополнительные настройки JS-плагина
     */
    public $pluginOptions = [];

    /**
     * @var string начальное состояние дерева
     */
    public $initialState = 'collapsed';

    /**
     * @var bool сохранять ли состояние дерева
     */
    public $saveState = false;

    /**
     * @var string способ сохранения состояния дерева
     */
    public $saveStateMethod = 'cookie';

    /**
     * @var string имя сохраненного состояния дерева
     */
    public $saveStateName = 'tree-grid-state';

    /**
     * @var int индекс колонки, в которой отображается дерево
     */
    public $treeColumn = 0;

    /**
     * @var array индексы колонок, по которым выполняется поиск
     */
    public $searchColumns = [0];

    /**
     * @var bool разрешить множественный выбор
     */
    public $multipleSelect = false;

    /**
     * @var bool выбирать дочерние узлы рекурсивно
     */
    public $selectRecursive = false;

    /**
     * @var string CSS-класс раскрытого узла
     */
    public $expandedClass = 'treegrid-expanded';

    /**
     * @var string CSS-класс закрытого узла
     */
    public $collapsedClass = 'treegrid-collapsed';

    /**
     * @var string CSS-класс выбранного узла
     */
    public $selectedClass = 'treegrid-selected';

    /**
     * @var string CSS-класс найденного узла
     */
    public $findedClass = 'treegrid-finded';

    /**
     * @var string префикс CSS-класса узла
     */
    public $treeNodeClassPrefix = 'treegrid-';

    /**
     * @var string префикс CSS-класса родителя узла
     */
    public $treeParentNodeClassPrefix = 'treegrid-parent-';

    /**
     * @var string CSS-класс поля поиска
     */
    public $searchInputClass = 'treegrid-search';

    /**
     * @var string CSS-класс Bootstrap-поля поиска
     */
    public $searchInputControlClass = 'form-control';

    /**
     * @var string CSS-класс контейнера поиска
     */
    public $searchContainerClass = 'treegrid-search-container';

    /**
     * @var string CSS-класс иконки поиска
     */
    public $searchIconClass = 'treegrid-search-icon';

    /**
     * @var string CSS-класс обычной иконки поиска
     */
    public $searchLogoClass = 'search-logo';

    /**
     * @var string CSS-класс flex-контейнера управления деревом
     */
    public $treeFlexContainerClass = 'treegrid-flex-container';

    /**
     * @var string CSS-класс группы кнопок управления справа
     */
    public $manageButtonGroupRightClass = 'treegrid-manage-button-group-right';

    /**
     * @var string CSS-класс группы кнопок управления слева
     */
    public $manageButtonGroupLeftClass = 'treegrid-manage-button-group-left';

    /**
     * @var array аттрибуты HTML для тега контейнера свободного пространства
     */
    public $containerRowOptions = ["class" => "treegrid-container row"];

    /**
     * @var array аттрибуты HTML для тега контейнера поля поиска
     */
    public $searchContainerOptions = [];

    /**
     * @var array аттрибты HTML для поля поиска
     */
    public $searchInputOptions = ["placeholder" => "Введите текст для поиска"];

    /**
     * @var string положение поля поиска в строке свободного пространства
     */
    public $searchPosition = self::SEARCH_POSITION_RIGHT;

    /**
     * @var array the HTML attributes for the table header row.
     * @see \yii\helpers\Html::renderTagAttributes() for details on how attributes are being rendered.
     */
    public $headerRowOptions = [];

    /**
     * @var array the HTML attributes for the table footer row.
     * @see \yii\helpers\Html::renderTagAttributes() for details on how attributes are being rendered.
     */
    public $footerRowOptions = [];

    /**
     * @var string the HTML display when the content of a cell is empty
     */
    public $emptyCell = '&nbsp;';

    /**
     * @var string the HTML content to be displayed when [[dataProvider]] does not have any data.
     */
    public $emptyText;

    /**
     * @var array the HTML attributes for the emptyText of the list view.
     * The "tag" element specifies the tag name of the emptyText element and defaults to "div".
     * @see \yii\helpers\Html::renderTagAttributes() for details on how attributes are being rendered.
     */
    public $emptyTextOptions = ['class' => 'empty'];

    /**
     * @var bool отображать ли поле поиска
     */
    public $showSearch = true;

    /**
     * @var bool отображать ли кнопки управления деревом
     */
    public $showTreeManageButtons = true;

    /**
     * @var bool отображать ли контейнер с контентом над таблицей
     */
    public $showContainerContent = true;

    /**
     * @var bool whether to show the header section of the grid table.
     */
    public $showHeader = true;

    /**
     * @var bool whether to show the footer section of the grid table.
     */
    public $showFooter = false;

    /**
     * @var bool whether to show the grid view if [[dataProvider]] returns no data.
     */
    public $showOnEmpty = true;

    /**
     * @var array|Formatter the formatter used to format model attribute values into displayable texts.
     */
    public $formatter;

    /**
     * @var array|Closure the HTML attributes for the table body rows.
     */
    public $tableRowOptions = [];

    /**
     * @var Closure an anonymous function that is called once BEFORE rendering each data model.
     */
    public $beforeTableRow;

    /**
     * @var Closure an anonymous function that is called once AFTER rendering each data model.
     */
    public $afterTableRow;

    /**
     * name of key column used to build tree
     * @var string name of key column used to build tree
     */
    public $keyColumnName;

    /**
     * @var string name of parent column used to build tree
     */
    public $parentColumnName;

    /**
     * @var mixed parent column value of root elements from data
     */
    public $parentRootValue = null;

    /**
     * Уровень узла по id.
     *
     * @var array
     */
    protected $treeNodeLevelById = [];

    /**
     * Признак наличия дочерних узлов по id.
     *
     * @var array
     */
    protected $treeNodeHasChildrenById = [];

    /**
     * Количество indent-span для корневого узла.
     *
     * Старый JS делал: getDepth() + 2.
     *
     * @var int
     */
    public $treeRootIndentCount = 2;

    /**
     * Прибавка indent-span на каждый уровень вложенности.
     *
     * Старый JS делал: parentDepth + 3.
     *
     * @var int
     */
    public $treeLevelIndentCount = 3;

    /**
     * @var array grid column configuration.
     */
    public $columns = [];

    /**
     * Initializes the grid view.
     */
    public function init()
    {
        if ($this->dataProvider === null) {
            throw new InvalidConfigException('The "dataProvider" property must be set.');
        }
        if ($this->emptyText === null) {
            $this->emptyText = Yii::t('yii', 'No results found.');
        }

        if (!isset($this->options['id'])) {
            $this->options['id'] = $this->getId();
        }

        if ($this->formatter == null) {
            $this->formatter = Yii::$app->getFormatter();
        } elseif (is_array($this->formatter)) {
            $this->formatter = Yii::createObject($this->formatter);
        }
        if (!$this->formatter instanceof Formatter) {
            throw new InvalidConfigException('The "formatter" property must be either a Format object or a configuration array.');
        }
        if (!$this->keyColumnName) {
            throw new InvalidConfigException('The "keyColumnName" property must be specified"');
        }
        if (!$this->parentColumnName) {
            throw new InvalidConfigException('The "parentColumnName" property must be specified"');
        }

        $this->initColumns();
    }

    /**
     * Runs the widget.
     */
    public function run()
    {
        $id = $this->options['id'];
        $options = Json::htmlEncode($this->getClientOptions());

        $view = $this->getView();
        TreeGridAsset::register($view);

        $view->registerJs("jQuery('#$id').treegrid($options);");

        if ($this->showSearch) {
            $view->registerJs("jQuery('#$id').treegrid('initSearch');");
        }
        if ($this->showTreeManageButtons) {
            $view->registerJs("jQuery('#$id').treegrid('initManageButtons');");
        }

        if ($this->showOnEmpty || $this->dataProvider->getCount() > 0) {
            $containerContent = $this->showContainerContent ? $this->renderContainerContent() : false;
            $header = $this->showHeader ? $this->renderTableHeader() : false;
            $body = $this->renderItems();
            $footer = $this->showFooter ? $this->renderTableFooter() : false;

            $tableContent = array_filter([
                $header,
                $body,
                $footer
            ]);

            $table = Html::tag('table', implode("\n", $tableContent), $this->tableOptions);
            $tableRow = Html::tag('div', $table, $this->tableContainerOptions);

            $content =  array_filter([
                $containerContent,
                $tableRow,
            ]);

            return Html::tag('div', implode("\n", $content), $this->options);
        } else {
            return $this->renderEmpty();
        }
    }

    /**
     * Возвращает настройки JS-плагина.
     *
     * @return array
     */
    protected function getClientOptions(): array
    {
        return array_merge($this->pluginOptions, [
            'initialState' => $this->initialState,
            'saveState' => $this->saveState,
            'saveStateMethod' => $this->saveStateMethod,
            'saveStateName' => $this->saveStateName,
            'treeColumn' => $this->treeColumn,
            'searchColumns' => $this->searchColumns,
            'multipleSelect' => $this->multipleSelect,
            'selectRecursive' => $this->selectRecursive,
            'expandedClass' => $this->expandedClass,
            'collapsedClass' => $this->collapsedClass,
            'selectedClass' => $this->selectedClass,
            'findedClass' => $this->findedClass,
            'getSearchInput' => new JsExpression($this->getSearchInputExpression()),
        ]);
    }

    /**
     * Возвращает JS-функцию получения поля поиска.
     *
     * @return string
     */
    protected function getSearchInputExpression(): string
    {
        $searchInputClass = addslashes($this->searchInputClass);

        return "function () { return $(this).find('.{$searchInputClass}'); }";
    }

    /**
     * Рендерит контейнер с контентом над таблицей
     * @return string результат рендера
     */
    public function renderContainerContent()
    {
        $search = $this->showSearch ? $this->renderSearch() : false;
        $expandAll = $this->showTreeManageButtons ? $this->renderButtonExpandAll() : false;
        $collapseAll = $this->showTreeManageButtons ? $this->renderButtonCollapseAll() : false;
        $containerSpaceContent = $this->renderContainerSpace();

        if (!$this->showSearch) {
            if ($this->showTreeManageButtons && $this->searchPosition === self::SEARCH_POSITION_RIGHT) {
                $buttonGroup = Html::tag("div", $expandAll . $collapseAll, ["class" => $this->manageButtonGroupRightClass]);
            } else if ($this->searchPosition === self::SEARCH_POSITION_LEFT) {
                $buttonGroup = Html::tag("div", $expandAll . $collapseAll, ["class" => $this->manageButtonGroupLeftClass]);
            } else {
                $buttonGroup = false;
            }
        } else {
            $buttonGroup = $expandAll . $collapseAll;
        }

        $manageContent = array_filter([
            $buttonGroup,
            $search
        ]);

        if ($this->searchPosition === self::SEARCH_POSITION_LEFT) {
            $manageContent = array_reverse($manageContent);
        }

        $manageContentOptions = [];

        if ($this->showSearch || $this->showTreeManageButtons) {
            if ($search) {
                Html::addCssClass($manageContentOptions, "col-sm-6");
                Html::addCssClass($manageContentOptions, $this->treeFlexContainerClass);
            } else if ($this->showTreeManageButtons) {
                Html::addCssClass($manageContentOptions, "col-sm-2");
            }

            $manageContent = Html::tag("div" , implode("\n", $manageContent), $manageContentOptions);
        } else {
            $manageContent = false;
        }

        $content = array_filter([
            $containerSpaceContent,
            $manageContent
        ]);

        if ($this->searchPosition === self::SEARCH_POSITION_LEFT) {
            $content = array_reverse($content);
        }

        return Html::tag("div", implode("\n", $content), $this->containerRowOptions);
    }

    /**
     * Рендерит контейнер с полем поиска
     * @return string результат рендера
     */
    public function renderSearch(): string
    {
        Html::addCssClass($this->searchInputOptions, $this->searchInputClass);
        Html::addCssClass($this->searchInputOptions, $this->searchInputControlClass);
        Html::addCssClass($this->searchContainerOptions, $this->searchContainerClass);

        $searchIconOptions = [];
        Html::addCssClass($searchIconOptions, $this->searchIconClass);
        Html::addCssClass($searchIconOptions, $this->searchLogoClass);

        $searchLogo = Html::tag("span", '', $searchIconOptions);
        $searchInput = Html::input("text", null, null, $this->searchInputOptions);

        return Html::tag("div", $searchLogo . $searchInput, $this->searchContainerOptions);
    }

    /**
     * Рендерит кнопку разворачивания всех узлов
     * @return string
     */
    public function renderButtonExpandAll(): string
    {
        $icon = Html::tag("span", '', ["id" => "treegrid-expand-all-icon"]);

        return Html::a($icon, null, ["id" => "treegrid-expand-all", "class" => "btn btn-primary", "style" => "padding: 0; height: 34px; width: 34px;"]);
    }

    /**
     * Рендерит кнопку сворачивания всех узлов
     * @return string
     */
    public function renderButtonCollapseAll(): string
    {
        $icon = Html::tag("span", '', ["id" => "treegrid-collapse-all-icon"]);

        return Html::button($icon, ["id" => "treegrid-collapse-all", "class" => "btn btn-danger", "style" => "padding: 0; height: 34px; width: 34px;"]);
    }

    /**
     * Рендерит пространство слева в контейнере над таблицей
     * @return string результат рендера
     */
    public function renderContainerSpace(): string
    {
        $containerOptions = [];
        if ($this->showTreeManageButtons && !$this->showSearch) {
            Html::addCssClass($containerOptions, "col-sm-10");
        } else if ($this->showSearch) {
            Html::addCssClass($containerOptions, "col-sm-6");
        } else {
            Html::addCssClass($containerOptions, "col-sm-12");
        }

        if ($this->containerSpace instanceof Closure) {
            $containerSpaceContent = call_user_func($this->containerSpace);
        } else {
            $containerSpaceContent = $this->containerSpace;
        }

        if ($containerSpaceContent === false) {
            return Html::tag("div", null, $containerOptions);
        }

        return Html::tag("div", $containerSpaceContent, $containerOptions);
    }

    /**
     * Renders the HTML content indicating that the list view has no data.
     * @return string the rendering result
     * @see emptyText
     */
    public function renderEmpty()
    {
        $options = $this->emptyTextOptions;
        $tag = ArrayHelper::remove($options, 'tag', 'div');

        return Html::tag($tag, ($this->emptyText === null ? Yii::t('yii', 'No results found.') : $this->emptyText), $options);
    }

    /**
     * Renders a table row with the given data model and key.
     * @param mixed $model the data model to be rendered
     * @param mixed $key the key associated with the data model
     * @param integer $index the zero-based index of the data model among the model array returned by [[dataProvider]].
     * @return string the rendering result
     */
    public function renderTableRow($model, $key, $index)
    {
        $cells = [];
        /* @var $column TreeColumn */
        foreach ($this->columns as $column) {
            $cells[] = $column->renderDataCell($model, $key, $index);
        }
        if ($this->tableRowOptions instanceof Closure) {
            $options = call_user_func($this->tableRowOptions, $model, $key, $index, $this);
        } else {
            $options = $this->tableRowOptions;
        }

        $options['data-id'] = is_array($key) ? json_encode($key) : (string)$key;

        $id = $this->getNodeId($model);
        Html::addCssClass($options, $this->treeNodeClassPrefix . $id);

        if ($this->nodeHasChildren($id)) {
            Html::addCssClass(
                $options,
                $this->isInitialStateCollapsed() ? $this->collapsedClass : $this->expandedClass
            );
        }

        $parentId = $this->getParentNodeId($model);

        if (!$this->isRootNodeParentId($parentId)) {
            $options['data-parent-id'] = $parentId;

            if ($this->isInitialStateCollapsed()) {
                Html::addCssStyle($options, 'display: none;');
            }

            Html::addCssClass($options, $this->treeParentNodeClassPrefix . $parentId);
        }

        return Html::tag('tr', implode('', $cells), $options);
    }

    /**
     * Renders the table header.
     * @return string the rendering result.
     */
    public function renderTableHeader()
    {
        $cells = [];
        foreach ($this->columns as $column) {
            /* @var $column TreeColumn */
            $cells[] = $column->renderHeaderCell();
        }
        $content = Html::tag('tr', implode('', $cells), $this->headerRowOptions);

        return "<thead>\n" . $content . "\n</thead>";
    }

    /**
     * Renders the table footer.
     * @return string the rendering result.
     */
    public function renderTableFooter()
    {
        $cells = [];
        foreach ($this->columns as $column) {
            /* @var $column TreeColumn */
            $cells[] = $column->renderFooterCell();
        }
        $content = Html::tag('tr', implode('', $cells), $this->footerRowOptions);

        return "<tfoot>\n" . $content . "\n</tfoot>";
    }

    /**
     * Renders the data models for the grid view.
     */
    public function renderItems()
    {
        $rows = [];
        $this->dataProvider->setKeys([]);
        $models = array_values($this->dataProvider->getModels());
        $models = $this->normalizeData($models, $this->parentRootValue);
        $this->dataProvider->setModels($models);
        $this->dataProvider->setKeys(null);
        $this->dataProvider->prepare();
        $keys = $this->dataProvider->getKeys();

        foreach ($models as $index => $model) {
            $key = $keys[$index];
            if ($this->beforeTableRow !== null) {
                $row = call_user_func($this->beforeTableRow, $model, $key, $index, $this);
                if (!empty($row)) {
                    $rows[] = $row;
                }
            }

            $rows[] = $this->renderTableRow($model, $key, $index);

            if ($this->afterTableRow !== null) {
                $row = call_user_func($this->afterTableRow, $model, $key, $index, $this);
                if (!empty($row)) {
                    $rows[] = $row;
                }
            }
        }

        if (empty($rows)) {
            $colspan = count($this->columns);

            return "<tr><td colspan=\"$colspan\">" . $this->renderEmpty() . "</td></tr>";
        }

        return implode("\n", $rows);
    }

    /**
     * Creates column objects and initializes them.
     */
    protected function initColumns()
    {
        if (empty($this->columns)) {
            $this->guessColumns();
        }
        foreach ($this->columns as $i => $column) {
            if (is_string($column)) {
                $column = $this->createDataColumn($column);
            } else {
                $column = Yii::createObject(array_merge([
                    'class' => $this->dataColumnClass ? : TreeColumn::className(),
                    'grid' => $this,
                ], $column));
            }
            if (!$column->visible) {
                unset($this->columns[$i]);
                continue;
            }

            $column->isTreeColumn = ((int)$i === $this->getTreeColumnIndex());

            $this->columns[$i] = $column;
        }
    }

    /**
     * Creates a [[DataColumn]] object based on a string in the format of "attribute:format:label".
     * @param string $text the column specification string
     * @return DataColumn the column instance
     * @throws InvalidConfigException if the column specification is invalid
     */
    protected function createDataColumn($text)
    {
        if (!preg_match('/^([^:]+)(:(\w*))?(:(.*))?$/', $text, $matches)) {
            throw new InvalidConfigException('The column must be specified in the format of "attribute", "attribute:format" or "attribute:format:label"');
        }

        return Yii::createObject([
            'class' => $this->dataColumnClass ? : TreeColumn::className(),
            'grid' => $this,
            'attribute' => $matches[1],
            'format' => isset($matches[3]) ? $matches[3] : 'text',
            'label' => isset($matches[5]) ? $matches[5] : null,
        ]);
    }

    /**
     * This function tries to guess the columns to show from the given data
     * if [[columns]] are not explicitly specified.
     */
    protected function guessColumns()
    {
        $models = $this->dataProvider->getModels();
        $model = reset($models);
        if (is_array($model) || is_object($model)) {
            foreach ($model as $name => $value) {
                $this->columns[] = $name;
            }
        }
    }

    /**
     * Нормализует данные дерева в плоский список с правильным порядком обхода.
     *
     * Дополнительно заполняет metadata дерева:
     * - treeNodeLevelById: уровень вложенности узла;
     * - treeNodeHasChildrenById: признак наличия дочерних узлов.
     *
     * @param array $data Исходный список моделей.
     * @param mixed $parentId Значение parentId, с которого начинается обход дерева.
     * @return array Плоский список моделей в порядке обхода дерева.
     * @throws \Exception
     */
    protected function normalizeData(array $data, $parentId = null): array
    {
        $childrenByParent = [];

        foreach ($data as $element) {
            $currentParentId = ArrayHelper::getValue($element, $this->parentColumnName);
            $parentKey = $this->normalizeTreeKey($currentParentId);

            if (!isset($childrenByParent[$parentKey])) {
                $childrenByParent[$parentKey] = [];
            }

            $childrenByParent[$parentKey][] = $element;
        }

        foreach ($data as $element) {
            $nodeId = $this->getNodeId($element);
            $nodeKey = $this->normalizeTreeKey($nodeId);

            $this->treeNodeHasChildrenById[$nodeKey] = !empty($childrenByParent[$nodeKey]);
        }

        return $this->normalizeDataByParent($childrenByParent, $parentId, 0);
    }

    /**
     * Рекурсивно собирает плоский список моделей по заранее построенному индексу детей.
     *
     * Во время обхода запоминает уровень вложенности каждого узла.
     *
     * @param array $childrenByParent Дети, сгруппированные по нормализованному parentId.
     * @param mixed $parentId Текущий parentId.
     * @param int $level Текущий уровень вложенности.
     * @return array Плоский список моделей в порядке обхода дерева.
     * @throws \Exception
     */
    protected function normalizeDataByParent(array $childrenByParent, $parentId = null, int $level = 0): array
    {
        $parentKey = $this->normalizeTreeKey($parentId);
        $children = $childrenByParent[$parentKey] ?? [];

        $result = [];

        foreach ($children as $element) {
            $nodeId = $this->getNodeId($element);
            $nodeKey = $this->normalizeTreeKey($nodeId);

            $this->treeNodeLevelById[$nodeKey] = $level;

            $result[] = $element;

            $nestedChildren = $this->normalizeDataByParent(
                $childrenByParent,
                $nodeId,
                $level + 1
            );

            if ($nestedChildren) {
                $result = array_merge($result, $nestedChildren);
            }
        }

        return $result;
    }

    /**
     * Возвращает индекс колонки, в которой отображается дерево.
     *
     * @return int
     * @throws \Exception
     */
    public function getTreeColumnIndex(): int
    {
        return (int)$this->treeColumn;
    }

    /**
     * Возвращает ID узла дерева из модели.
     *
     * @param mixed $model
     * @return mixed
     * @throws \Exception
     */
    public function getNodeId($model)
    {
        return ArrayHelper::getValue($model, $this->keyColumnName);
    }

    /**
     * Возвращает ID родительского узла из модели.
     *
     * @param mixed $model
     * @return mixed
     * @throws \Exception
     */
    public function getParentNodeId($model)
    {
        return ArrayHelper::getValue($model, $this->parentColumnName);
    }

    /**
     * Нормализует значение id / parentId для использования во внутренних metadata-массивах дерева.
     *
     * @param mixed $value
     * @return string
     */
    protected function normalizeTreeKey($value): string
    {
        if ($value === null || $value === '') {
            return '__treegrid_root__';
        }

        return (string)$value;
    }

    /**
     * Проверяет, что parentId указывает на корневой уровень дерева.
     *
     * @param mixed $parentId
     * @return bool
     */
    protected function isRootNodeParentId($parentId): bool
    {
        return $parentId == $this->parentRootValue;
    }

    /**
     * Проверяет, есть ли у узла дочерние элементы.
     *
     * @param mixed $nodeId
     * @return bool
     */
    public function nodeHasChildren($nodeId): bool
    {
        $nodeKey = $this->normalizeTreeKey($nodeId);

        return !empty($this->treeNodeHasChildrenById[$nodeKey]);
    }

    /**
     * Возвращает уровень вложенности узла.
     *
     * Корневые узлы имеют уровень 0.
     *
     * @param mixed $nodeId
     * @return int
     */
    public function getNodeLevel($nodeId): int
    {
        $nodeKey = $this->normalizeTreeKey($nodeId);

        return $this->treeNodeLevelById[$nodeKey] ?? 0;
    }

    /**
     * Возвращает количество span.treegrid-indent для узла.
     *
     * @param mixed $nodeId
     * @return int
     */
    public function getNodeIndentCount($nodeId): int
    {
        return $this->treeRootIndentCount + ($this->getNodeLevel($nodeId) * $this->treeLevelIndentCount);
    }

    /**
     * Проверяет начальное состояние дерева.
     *
     * @return bool
     */
    protected function isInitialStateCollapsed(): bool
    {
        return $this->initialState === 'collapsed';
    }
}
