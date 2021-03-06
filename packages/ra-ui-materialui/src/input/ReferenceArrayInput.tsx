import * as React from 'react';
import { FC, ReactElement } from 'react';
import PropTypes from 'prop-types';
import {
    InputProps,
    useReferenceArrayInputController,
    useInput,
    useTranslate,
    SortPayload,
    PaginationPayload,
    Translate,
    ResourceContextProvider,
} from 'ra-core';

import sanitizeInputRestProps from './sanitizeInputRestProps';
import LinearProgress from '../layout/LinearProgress';
import Labeled from './Labeled';
import ReferenceError from './ReferenceError';
import { FieldInputProps, FieldMetaState } from 'react-final-form';

export interface ReferenceArrayInputProps extends InputProps {
    allowEmpty?: boolean;
    basePath?: string;
    children: ReactElement;
    classes?: any;
    className?: string;
    label?: string;
    reference: string;
    resource?: string;
    [key: string]: any;
}

/**
 * An Input component for fields containing a list of references to another resource.
 * Useful for 'hasMany' relationship.
 *
 * @example
 * The post object has many tags, so the post resource looks like:
 * {
 *    id: 1234,
 *    tag_ids: [ "1", "23", "4" ]
 * }
 *
 * ReferenceArrayInput component fetches the current resources (using
 * `dataProvider.getMany()`) as well as possible resources (using
 * `dataProvider.getMatching()`) in the reference endpoint. It then
 * delegates rendering to a subcomponent, to which it passes the possible
 * choices as the `choices` attribute.
 *
 * Use it with a selector component as child, like `<SelectArrayInput>`
 * or <CheckboxGroupInput>.
 *
 * @example
 * export const PostEdit = (props) => (
 *     <Edit {...props}>
 *         <SimpleForm>
 *             <ReferenceArrayInput source="tag_ids" reference="tags">
 *                 <SelectArrayInput optionText="name" />
 *             </ReferenceArrayInput>
 *         </SimpleForm>
 *     </Edit>
 * );
 *
 * By default, restricts the possible values to 25. You can extend this limit
 * by setting the `perPage` prop.
 *
 * @example
 * <ReferenceArrayInput
 *      source="tag_ids"
 *      reference="tags"
 *      perPage={100}>
 *     <SelectArrayInput optionText="name" />
 * </ReferenceArrayInput>
 *
 * By default, orders the possible values by id desc. You can change this order
 * by setting the `sort` prop (an object with `field` and `order` properties).
 *
 * @example
 * <ReferenceArrayInput
 *      source="tag_ids"
 *      reference="tags"
 *      sort={{ field: 'name', order: 'ASC' }}>
 *     <SelectArrayInput optionText="name" />
 * </ReferenceArrayInput>
 *
 * Also, you can filter the query used to populate the possible values. Use the
 * `filter` prop for that.
 *
 * @example
 * <ReferenceArrayInput
 *      source="tag_ids"
 *      reference="tags"
 *      filter={{ is_public: true }}>
 *     <SelectArrayInput optionText="name" />
 * </ReferenceArrayInput>
 *
 * The enclosed component may filter results. ReferenceArrayInput passes a
 * `setFilter` function as prop to its child component. It uses the value to
 * create a filter for the query - by default { q: [searchText] }. You can
 * customize the mapping searchText => searchQuery by setting a custom
 * `filterToQuery` function prop:
 *
 * @example
 * <ReferenceArrayInput
 *      source="tag_ids"
 *      reference="tags"
 *      filterToQuery={searchText => ({ name: searchText })}>
 *     <SelectArrayInput optionText="name" />
 * </ReferenceArrayInput>
 */
const ReferenceArrayInput: FC<ReferenceArrayInputProps> = ({
    children,
    id: idOverride,
    onBlur,
    onChange,
    onFocus,
    validate,
    parse,
    format,
    ...props
}) => {
    if (React.Children.count(children) !== 1) {
        throw new Error(
            '<ReferenceArrayInput> only accepts a single child (like <Datagrid>)'
        );
    }

    const { id, input, isRequired, meta } = useInput({
        id: idOverride,
        onBlur,
        onChange,
        onFocus,
        source: props.source,
        validate,
        parse,
        format,
        ...props,
    });

    const controllerProps = useReferenceArrayInputController({
        ...props,
        input,
    });

    const translate = useTranslate();

    return (
        <ReferenceArrayInputView
            id={id}
            input={input}
            isRequired={isRequired}
            meta={meta}
            translate={translate}
            children={children}
            {...props}
            {...controllerProps}
        />
    );
};

ReferenceArrayInput.propTypes = {
    allowEmpty: PropTypes.bool,
    basePath: PropTypes.string,
    children: PropTypes.element.isRequired,
    className: PropTypes.string,
    filter: PropTypes.object,
    filterToQuery: PropTypes.func.isRequired,
    label: PropTypes.string,
    perPage: PropTypes.number,
    reference: PropTypes.string.isRequired,
    resource: PropTypes.string,
    sort: PropTypes.shape({
        field: PropTypes.string,
        order: PropTypes.oneOf(['ASC', 'DESC']),
    }),
    source: PropTypes.string,
};

ReferenceArrayInput.defaultProps = {
    filter: {},
    filterToQuery: searchText => (searchText ? { q: searchText } : {}),
    perPage: 25,
    sort: { field: 'id', order: 'DESC' },
};

const sanitizeRestProps = ({
    crudGetMany,
    crudGetMatching,
    filterToQuery,
    perPage,
    referenceSource,
    ...rest
}: any) => sanitizeInputRestProps(rest);

export interface ReferenceArrayInputViewProps {
    allowEmpty?: boolean;
    basePath?: string;
    children: ReactElement;
    choices: any[];
    classes?: object;
    className?: string;
    error?: string;
    helperText?: string | boolean;
    id: string;
    input: FieldInputProps<any, HTMLElement>;
    isRequired: boolean;
    label?: string;
    loading: boolean;
    meta: FieldMetaState<any>;
    onChange: any;
    options?: any;
    reference: string;
    resource?: string;
    setFilter: (v: string) => void;
    setPagination: (pagination: PaginationPayload) => void;
    setSort: (sort: SortPayload, order?: string) => void;
    source: string;
    translate: Translate;
    warning?: string;
}

export const ReferenceArrayInputView = ({
    allowEmpty,
    basePath,
    children,
    choices,
    className,
    error,
    input,
    loading,
    isRequired,
    label,
    meta,
    onChange,
    options,
    reference,
    resource,
    setFilter,
    setPagination,
    setSort,
    source,
    translate,
    warning,
    ...rest
}: ReferenceArrayInputViewProps) => {
    const translatedLabel = translate(
        label || `resources.${resource}.fields.${source}`,
        { _: label }
    );

    if (loading) {
        return (
            <Labeled
                label={translatedLabel}
                source={source}
                resource={resource}
                className={className}
                isRequired={isRequired}
            >
                <LinearProgress />
            </Labeled>
        );
    }

    if (error) {
        return <ReferenceError label={translatedLabel} error={error} />;
    }

    return (
        <ResourceContextProvider value={reference}>
            {React.cloneElement(children, {
                allowEmpty,
                basePath,
                choices,
                className,
                error,
                input,
                isRequired,
                label: translatedLabel,
                meta: {
                    ...meta,
                    helperText: warning || false,
                },
                onChange,
                options,
                resource,
                setFilter,
                setPagination,
                setSort,
                source,
                translateChoice: false,
                limitChoicesToValue: true,
                ...sanitizeRestProps(rest),
                ...children.props,
            })}
        </ResourceContextProvider>
    );
};

ReferenceArrayInputView.propTypes = {
    allowEmpty: PropTypes.bool,
    basePath: PropTypes.string,
    children: PropTypes.element,
    choices: PropTypes.array,
    className: PropTypes.string,
    error: PropTypes.string,
    loading: PropTypes.bool,
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object,
    onChange: PropTypes.func,
    options: PropTypes.object,
    resource: PropTypes.string.isRequired,
    setFilter: PropTypes.func,
    setPagination: PropTypes.func,
    setSort: PropTypes.func,
    source: PropTypes.string,
    translate: PropTypes.func.isRequired,
    warning: PropTypes.string,
};

export default ReferenceArrayInput;
