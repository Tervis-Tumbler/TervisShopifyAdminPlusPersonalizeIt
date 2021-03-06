import {
    html,
    render,
    directive
} from 'https://unpkg.com/lit-html@1.1.2?module'

import {
    ifDefined
} from 'https://unpkg.com/lit-html@1.1.2/directives/if-defined.js?module'

import {
    Get_TervisProductMetaDataUsingIndex
} from 'https://unpkg.com/@tervis/tervisproductmetadata?module'

import {
    New_Range,
    Add_MemberScriptProperty
} from 'https://unpkg.com/@tervis/tervisutilityjs?module'

var $ItemUPCToAddToCartForOneSidedPersonaliztaion = "093597845116"
var $ItemUPCToAddToCartForTwoSidedPersonaliztaion = "093597845123"

var $ItemSKUToAddToCartForOneSidedPersonaliztaion = "1154266"
var $ItemSKUToAddToCartForTwoSidedPersonaliztaion = "1154269"

var $ItemVariantIDToAddToCartForOneSidedPersonaliztaion = "30370826125393"
var $ItemVariantIDToAddToCartForTwoSidedPersonaliztaion = "31038255431761"

var $Debug = true

async function main () {
    Initialize_TervisShopifyPOSPersonalizationFormStructure()
    Receive_ShopifyPOSPersonalizationCart()
}

function Initialize_TervisShopifyPOSPersonalizationFormStructure () {
    Set_ContainerContent({
        $TargetElementSelector: "#content",
        $Content: html`
            <form id="ShopifyPOSPersonalizationForm">
                <div id="LineItemSelectContainer"></div>
                <div id="PersonalizationInformationContainer"></div>
                <div id="PersonalizationChargeLineItemsContainer"></div>
                <div id="Debug"></div>
            </form>
        `
    })
}

async function Receive_ShopifyPOSPersonalizationCart () {
    var $Cart = await Get_TervisShopifyCart()
    Out_TervisShopifyPOSDebug({$Object: $Cart})
    var $Content = New_TervisShopifyPOSPersonalizableLineItemSelect({$Cart})
    Set_ContainerContent({
        $TargetElementSelector: "#LineItemSelectContainer",
        $Content
    })
}

function Out_TervisShopifyPOSDebug ({
    $Object
}) {
    if ($Debug) {
        Set_ContainerContent({
            $TargetElementSelector: "#Debug",
            $Content: html`<textarea rows="30" cols="60">${JSON.stringify($Object, null, 2)}</textarea>`
        })    
    }
}

function Get_TervisShopifyPOSPersonalizableLineItem ({
    $Cart
}) {
    return $Cart.line_items.filter(
        $LineItem => $LineItem.sku ? $LineItem.sku.slice(-1) === "P" : undefined
    )
}

function New_TervisShopifyPOSPersonalizableLineItemSelect ({
    $Cart
}) {
    var $PersonalizableLineItems = Get_TervisShopifyPOSPersonalizableLineItem({$Cart})

    return New_TervisSelect({
        $Title: "Select Line Item To Personalize",
        $Options: $PersonalizableLineItems.map(
            $LineItem => ({
                Value: $Cart.line_items.indexOf($LineItem),
                Text: `${$LineItem.title} ${$LineItem.quantity}`
            })
        ),
        $OnChange: Receive_TervisShopifyPOSPersonalizableLineItemSelectOnChange
    })
}

function Get_TervisShopifyPOSPersonalizableLineItemQuantityRemainingToPersonalize ({
    $PersonalizableLineItem,
    $PersonalizationChargeLineItems
}) {
    var $SumOfQuantityOfPersonalizationChargeLines = $PersonalizationChargeLineItems ?
        $PersonalizationChargeLineItems
        .reduce(
            ($Sum, $PersonalizationChargeLineItem) =>
            ($Sum + Number($PersonalizationChargeLineItem.quantity)),
            0
        ) :
        0

    return $PersonalizableLineItem.quantity - $SumOfQuantityOfPersonalizationChargeLines
}

async function Receive_TervisShopifyPOSPersonalizableLineItemSelectOnChange ($Event) {
    var $IndexInCartOfSelectedPersonalizableLineItem = $Event.target.value
    var $Cart = await Get_TervisShopifyCart()
    var $SelectedPersonalizableLineItem = $Cart.line_items[$IndexInCartOfSelectedPersonalizableLineItem]
    var $PersonalizationChargeLineItems =
    Get_TervisShopifyPOSPersonalizableLineItemAssociatedPersonalizationChargeLine({
        $Cart,
        $PersonalizableLineItem: $SelectedPersonalizableLineItem
    })

    var $ProductQuantityRemainingThatCanBePersonalized = Get_TervisShopifyPOSPersonalizableLineItemQuantityRemainingToPersonalize ({
        $PersonalizableLineItem: $SelectedPersonalizableLineItem,
        $PersonalizationChargeLineItems
    })

    var {
        $ProductSize,
        $ProductFormType
    } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $SelectedPersonalizableLineItem.title })

    var $Content = []
    if ($ProductQuantityRemainingThatCanBePersonalized > 0) {
        $Content.push(
            await New_TervisPersonalizationForm({
                $ProductSize,
                $ProductFormType,
                $ProductQuantityRemainingThatCanBePersonalized
            })
        )
    }

    for (var $PersonalizationChargeLineItem of $PersonalizationChargeLineItems) {
        $Content.push(await New_TervisShopifyPOSPersonaliztaionChargeLineItemDisplay({$PersonalizationChargeLineItem, $Cart}))
    }

    Set_ContainerContent({
        $TargetElementSelector: "#PersonalizationInformationContainer",
        $Content
    })
}

async function Update_PersonalizationForm () {
    var $Cart = await Get_TervisShopifyCart()
    var $SelectedPersonalizableLineItem = await Get_TervisShopifyPOSPersonalizableLineItemSelected()
    var $PersonalizationChargeLineItems =
    Get_TervisShopifyPOSPersonalizableLineItemAssociatedPersonalizationChargeLine({
        $Cart,
        $PersonalizableLineItem: $SelectedPersonalizableLineItem
    })

    var $ProductQuantityRemainingThatCanBePersonalized = Get_TervisShopifyPOSPersonalizableLineItemQuantityRemainingToPersonalize ({
        $PersonalizableLineItem: $SelectedPersonalizableLineItem,
        $PersonalizationChargeLineItems
    })

    var {
        $ProductSize,
        $ProductFormType
    } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $SelectedPersonalizableLineItem.title })

    var $Content = []
    if ($ProductQuantityRemainingThatCanBePersonalized > 0) {
        $Content.push(
            await New_TervisPersonalizationForm({
                $ProductSize,
                $ProductFormType,
                $ProductQuantityRemainingThatCanBePersonalized
            })
        )
    }

    for (var $PersonalizationChargeLineItem of $PersonalizationChargeLineItems) {
        $Content.push(await New_TervisShopifyPOSPersonaliztaionChargeLineItemDisplay({$PersonalizationChargeLineItem, $Cart}))
    }

    Set_ContainerContent({
        $TargetElementSelector: "#PersonalizationInformationContainer",
        $Content
    })
}

async function Receive_TervisShopifyPOSPersonalizationChargeLineEditOnClick ($Event) {
    var $IndexOfPersonalizationChargeLineInCart = $Event.target.id
    var $Cart = await Get_TervisShopifyCart()
    var $PersonalizationChargeLineItemToEdit = $Cart.line_items[$IndexOfPersonalizationChargeLineInCart]
    Add_PersonalizationChargeLineCustomProperties({
        $PersonalizationChargeLineItem: $PersonalizationChargeLineItemToEdit
    })
    
    var $SelectedPersonalizableLineItem = Get_LineItemRelatedToPersonalizationChargeLineItem({ 
        $PersonalizationChargeLineItem: $PersonalizationChargeLineItemToEdit,
        $Cart
    })
    var $PersonalizationChargeLineItems =
    Get_TervisShopifyPOSPersonalizableLineItemAssociatedPersonalizationChargeLine({
        $Cart,
        $PersonalizableLineItem: $SelectedPersonalizableLineItem
    })

    var $ProductQuantityRemainingThatCanBePersonalized = Get_TervisShopifyPOSPersonalizableLineItemQuantityRemainingToPersonalize ({
        $PersonalizableLineItem: $SelectedPersonalizableLineItem,
        $PersonalizationChargeLineItems
    }) + $PersonalizationChargeLineItemToEdit.quantity

    var {
        $ProductSize,
        $ProductFormType
    } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $SelectedPersonalizableLineItem.title })

    var $Content = []
    if ($ProductQuantityRemainingThatCanBePersonalized > 0) {
        $Content.push(
            await New_TervisPersonalizationForm({
                $ProductSize,
                $ProductFormType,
                $PersonalizationChargeLineItem: $PersonalizationChargeLineItemToEdit,
                $IndexOfPersonalizationChargeLineInCart,
                $ProductQuantityRemainingThatCanBePersonalized
            })
        )
    }

    $PersonalizationChargeLineItems.splice(
        $PersonalizationChargeLineItems.indexOf($PersonalizationChargeLineItemToEdit),
        1
    )

    for (var $PersonalizationChargeLineItem of $PersonalizationChargeLineItems) {
        $Content.push(await New_TervisShopifyPOSPersonaliztaionChargeLineItemDisplay({$PersonalizationChargeLineItem, $Cart}))
    }

    Set_ContainerContent({
        $TargetElementSelector: "#PersonalizationInformationContainer",
        $Content
    })

    // var {
    //     $ProductSize,
    //     $ProductFormType
    // } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $LineItemToEdit.title })

    // var $PersonalizationPropertiesFromLineItem = Get_PersonalizationPropertiesFromPersonalizationChargeLineItem({
    //     $PersonalizationChargeLineItem: $LineItemToEdit
    // })

    // var $SumOfQuantityOfPersonalizationChargeLines = $PersonalizationPropertiesFromLineItem ?
    //     $PersonalizationPropertiesFromLineItem
    //     .reduce(
    //         ($Sum, $PersonalizationProperties) =>
    //         ($Sum + Number($PersonalizationProperties.Quantity)),
    //         0
    //     ) :
    //     0

    // var $QuantityRemiainingToBePersonalized = $LineItemToEdit.quantity + $SumOfQuantityOfPersonalizationChargeLines

    // New_TervisPersonalizationForm({
    //     $PersonalizationChargeLineItem,
    //     $ProductSize,
    //     $ProductFormType,
    //     $ProductQuantityRemainingThatCanBePersonalized: $QuantityRemiainingToBePersonalized
    // })
}

async function New_TervisPersonalizationForm ({
    $PersonalizationChargeLineItem,
    $IndexOfPersonalizationChargeLineInCart,
    $ProductSize,
    $ProductFormType,
    $ProductQuantityRemainingThatCanBePersonalized
}) {
    return html`
        ${await New_TervisShopifyPersonalizationChargeLineItemIDInput({$IndexOfPersonalizationChargeLineInCart})}
        ${await New_TervisShopifyPOSPersonalizationQuantityOfLineQuantityToRecieveThisPersonalizationSelect({
            $PersonalizationChargeLineItem,
            $ProductQuantityRemainingThatCanBePersonalized
        })}
        ${await New_TervisPersonalizationPropertiesForm({
            $PersonalizationChargeLineItem,
            $ProductSize,
            $ProductFormType
        })}
        <button
            type="button"
            @click=${Invoke_TervisShopifyPOSPersonalizationSave}
        >Save</button>
        <br>
    `
}

async function New_TervisShopifyPersonalizationChargeLineItemIDInput({
    $IndexOfPersonalizationChargeLineInCart
}) {
    return html`
        <input 
            type="hidden"
            .value=${forceWrite($IndexOfPersonalizationChargeLineInCart ? $IndexOfPersonalizationChargeLineInCart : "")}
        >
    `
}

async function New_TervisShopifyPOSPersonaliztaionChargeLineItemDisplay ({
    $PersonalizationChargeLineItem,
    $Cart
}) {
    var $IndexOfPersonalizationChargeLineItem = $Cart.line_items.indexOf($PersonalizationChargeLineItem)
    var $Content
    $Content = Object.entries($PersonalizationChargeLineItem.PropertiesObject)
    .filter(
        ([$Name, ]) => !["RelatedLineItemSKU", "ID"].includes($Name)
    )
    .map(
        ([$Name, $Value]) =>
        html`
            ${$Name}: ${$Value}<br />
        `
    )

    $Content.push(html`Quantity: ${$PersonalizationChargeLineItem.quantity}<br />`)
    $Content.push(html`
        <button
            type="button"
            id=${$IndexOfPersonalizationChargeLineItem}
            @click=${Receive_TervisShopifyPOSPersonalizationChargeLineEditOnClick}
        >Edit</button>
        <button
            type="button"
            id=${$IndexOfPersonalizationChargeLineItem}
            @click=${Receive_TervisShopifyPOSPersonalizationChargeLineRemoveOnClick}
        >Remove</button>
        <br>
    `)

    return $Content
}

function Get_LineItemRelatedToPersonalizationChargeLineItem ({
    $PersonalizationChargeLineItem,
    $Cart
}) {

    return $Cart.line_items.filter( 
        $LineItem =>
        $LineItem.sku === $PersonalizationChargeLineItem.PropertiesObject.RelatedLineItemSKU
    )[0]
}

async function Receive_TervisShopifyPOSPersonalizationChargeLineRemoveOnClick ($Event) {
    var $IndexOfPersonalizationChargeLineToRemove = $Event.target.id
    var $Cart = await Get_TervisShopifyCart()

    $Cart = await Remove_TervisShopifyCartLineItem({
        $Cart,
        $LineItemIndex: $IndexOfPersonalizationChargeLineToRemove
    })

    await Update_PersonalizationForm()
    Out_TervisShopifyPOSDebug({$Object: $Cart})
}

async function New_TervisShopifyPOSPersonalizationQuantityOfLineQuantityToRecieveThisPersonalizationSelect ({
    $PersonalizationChargeLineItem,
    $ProductQuantityRemainingThatCanBePersonalized
}) {
    return New_TervisSelect({
        $Title: "Quantity of line item to apply personalization to",
        $Required: true,
        $Options:  New_Range({$Start: 1, $Stop: $ProductQuantityRemainingThatCanBePersonalized})
        .map(
            $Quantity =>
            ({
                Text: $Quantity,
                Selected: $PersonalizationChargeLineItem ? $Quantity === $PersonalizationChargeLineItem.quantity : undefined
            })
        )
    })
}

async function Get_TervisShopifyPOSPersonalizableLineItemSelected () {
    var $Cart = await Get_TervisShopifyCart()
    var $SelectedLineItemIndex = Get_TervisShopifyPOSPersonalizationLineItemSelectedIndex()
    return $Cart.line_items[$SelectedLineItemIndex]
}

function Get_TervisShopifyPOSPersonalizationLineItemSelectedIndex () {
    return Get_ElementPropertyValue({
        $QuerySelector: "#LineItemSelectContainer > select",
        $PropertyName: "value" 
    })
}

async function Receive_TervisPersonalizationFontPickerOnChange ($Event) {
    var $Element = document.querySelector(`[title='${$Event.target.title}']`)
    var $IndexOfPersonalizationChargeLineBeingEdited = $Element.closest("div").querySelector("[type='hidden']").value
    var $Cart = await Get_TervisShopifyCart()
    var $PersonalizationChargeLineItem = $Cart.line_items[$IndexOfPersonalizationChargeLineBeingEdited]
    Add_PersonalizationChargeLineCustomProperties({
        $PersonalizationChargeLineItem
    })

    var $SideNumber = $Event.target.title[4]
    
    var $SelectedPersonalizableLineItem = await Get_TervisShopifyPOSPersonalizableLineItemSelected()

    var {
        $ProductSize,
        $ProductFormType
    } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $SelectedPersonalizableLineItem.title })

    var $ProductMetadata = await Get_TervisProductMetaDataUsingIndex({$ProductSize, $ProductFormType})
    var $Content = New_TervisPersonalizationPropertiesSideAndLineForm({
        $PersonalizationChargeLineItem,
        $ProductMetadata,
        $SideNumber
    })

    Set_ContainerContent({
        $TargetElementSelector: `[title='${$Event.target.title}'] ~ [name='PersonalizationPropertiesSideAndLineFormContainer']`,
        $Content
    })

    // await Update_PersonalizationForm()

    // Update_TervisPersonalizationSideAndLineElement()
}

// async function Update_TervisPersonalizationSideAndLineElement () {
//     var $SelectedLineItem = await Get_TervisShopifyPOSPersonalizableLineItemSelected()
//     var {
//         $ProductSize,
//         $ProductFormType
//     } = ConvertFrom_TervisShopifyPOSProductTitle({ $ProductTitle: $SelectedLineItem.title })

//     var $Content = New_TervisPersonalizationPropertiesForm({
//         $ProductSize,
//         $ProductFormType
//     })
// }

function New_TervisPersonalizationPropertiesSideAndLineForm ({
    $PersonalizationChargeLineItem,
    $ProductMetadata,
    $SideNumber
}) {
    var $FontMetadata = Get_TervisPersonalizationSelectedFontMetadata({
        $PersonalizationChargeLineItem,
        $SideNumber
    })

    if ($FontMetadata) {
        var $Content = []
        if (!$FontMetadata.MonogramStyle) {
            for (var $LineNumber of New_Range({$Start: 1, $Stop: $ProductMetadata.Personalization.MaximumLineCount})) {
                var $ID = `Side${$SideNumber}Line${$LineNumber}`
                $Content.push(
                    New_InputText({
                        $ID,
                        $PlaceHolder: $ID,
                        $MaxLength: $FontMetadata.MaximumCharactersPerLine,
                        $Value: $PersonalizationChargeLineItem ? $PersonalizationChargeLineItem.PropertiesObject[$ID] ? $PersonalizationChargeLineItem.PropertiesObject[$ID] : "" : undefined
                    })
                )
            }
        } else {
            var $ID = `Side${$SideNumber}Line1`
            $Content.push(
                New_InputText({
                    $ID,
                    $PlaceHolder: $ID,
                    $MaxLength: 3,
                    $MinLength: $FontMetadata.AllCharactersRequired ? 3 : undefined,
                    $Pattern: $MonogramValidCharactersPatternAttributeRegex,
                    $Value: $PersonalizationChargeLineItem ? $PersonalizationChargeLineItem.PropertiesObject[$ID] ? $PersonalizationChargeLineItem.PropertiesObject[$ID] : "" : undefined
                })
            )
        }
        return $Content
    }
}

var $MonogramValidCharactersPatternAttributeRegex = "[A-Z]*"

async function New_TervisPersonalizationPropertiesForm ({
    $PersonalizationChargeLineItem,
    $ProductSize,
    $ProductFormType
}) {
    var $ProductMetadata = await Get_TervisProductMetaDataUsingIndex({$ProductSize, $ProductFormType})
    
    var $Content = []
    for (var $SideNumber of New_Range({$Start: 1, $Stop: $ProductMetadata.Personalization.MaximumSideCount})) {
        $Content.push(
            New_TervisSelect({
                $Title: `Side${$SideNumber}ColorName`,
                $Required: true,
                $Options: $PersonalizationColors.map(
                    $Color =>
                    ({
                        Text: $Color,
                        Selected: $PersonalizationChargeLineItem ?
                            $Color === $PersonalizationChargeLineItem.PropertiesObject[`Side${$SideNumber}ColorName`] :
                            undefined
                    })
                )
            })
        )
        
        var $FontNames = $ProductMetadata.Personalization.SupportedFontName
        $Content.push(
            New_TervisSelect({
                $Title: `Side${$SideNumber}FontName`,
                $Required: true,
                $Options: $FontNames.map(
                    $FontName => ({
                        Text: $FontName,
                        Selected: $PersonalizationChargeLineItem ?
                        $FontName === $PersonalizationChargeLineItem.PropertiesObject[`Side${$SideNumber}FontName`] :
                        undefined
                    })
                ),
                $OnChange: Receive_TervisPersonalizationFontPickerOnChange
            })
        )

        var $Thing = New_TervisPersonalizationPropertiesSideAndLineForm({
            $PersonalizationChargeLineItem,
            $ProductMetadata,
            $SideNumber
        })

        $Content.push(
            html`
                <div name="PersonalizationPropertiesSideAndLineFormContainer">
                   ${$Thing}
                </div>
            `
        )


        // var $FontMetadata = Get_TervisPersonalizationSelectedFontMetadata({
        //     $PersonalizationChargeLineItem,
        //     $SideNumber
        // })

        // if ($FontMetadata) {
        //     if (!$FontMetadata.MonogramStyle) {
        //         for (var $LineNumber of New_Range({$Start: 1, $Stop: $ProductMetadata.Personalization.MaximumLineCount})) {
        //             var $ID = `Side${$SideNumber}Line${$LineNumber}`
        //             $Content.push(
        //                 New_InputText({
        //                     $ID,
        //                     $PlaceHolder: $ID,
        //                     $MaxLength: $FontMetadata.MaximumCharactersPerLine,
        //                     $Value: $PersonalizationChargeLineItem ? $PersonalizationChargeLineItem.PropertiesObject[$ID] ? $PersonalizationChargeLineItem.PropertiesObject[$ID] : "" : undefined
        //                 })
        //             )
        //         }
        //     } else {
        //         var $ID = `Side${$SideNumber}Line1`
        //         $Content.push(
        //             New_InputText({
        //                 $ID,
        //                 $PlaceHolder: $ID,
        //                 $MaxLength: 3,
        //                 $MinLength: $FontMetadata.AllCharactersRequired ? 3 : undefined,
        //                 $Pattern: $MonogramValidCharactersPatternAttributeRegex,
        //                 $Value: $PersonalizationChargeLineItem ? $PersonalizationChargeLineItem.PropertiesObject[$ID] ? $PersonalizationChargeLineItem.PropertiesObject[$ID] : "" : undefined
        //             })
        //         )
        //     }
        // }
    }
    return $Content
}

async function Invoke_TervisShopifyPOSPersonalizationSave () {
    if (document.querySelector("#ShopifyPOSPersonalizationForm").reportValidity()) {
        var $Cart = await Get_TervisShopifyCart()
        var $SelectedLineItem = await Get_TervisShopifyPOSPersonalizableLineItemSelected()
        var $PersonalizationProperties = await Get_TervisPersonalizationFormProperties()
        var $PersonalizationChargeLineItemQuantity = Number(Get_ElementPropertyValue({
            $QuerySelector: "[title='Quantity of line item to apply personalization to']",
            $PropertyName: "value"
        }))
        var $NumberOfPersonalizedSides = Get_TervisPersonalizationNumberSides({$PersonalizationProperties})
        var $LineItemProperties = $PersonalizationProperties

        $LineItemProperties.RelatedLineItemSKU = $SelectedLineItem.sku
        
        var $Price
        if ($NumberOfPersonalizedSides === 1) {
            $Price = 5
        } else if ($NumberOfPersonalizedSides === 2) {
            $Price = 7.5
        }

        var $IndexOfPersonalizationChargeLineBeingEdited = Get_ElementPropertyValue({
            $QuerySelector: "input[type='hidden']",
            $PropertyName: "value"
        })

        if($IndexOfPersonalizationChargeLineBeingEdited) {
            $Cart = await Remove_TervisShopifyCartLineItem({
                $Cart,
                $LineItemIndex: $IndexOfPersonalizationChargeLineBeingEdited
            })
        }

        $Cart = await Add_TervisShopifyCartLineItem({
            $Cart,
            $Price,
            $Quantity: $PersonalizationChargeLineItemQuantity,
            $Title: `Personalization for ${$SelectedLineItem.title} ${crypto.getRandomValues(new Uint16Array(1))[0]}`
        })

        var $LineItemIndex = $Cart.line_items.length - 1
        
        $Cart = await Add_TervisShopifyCartLineItemProperties({
            $Cart,
            $LineItemIndex,
            $LineItemProperties
        })

        await Update_PersonalizationForm()
        Out_TervisShopifyPOSDebug({$Object: $Cart})
    }
}

function Get_TervisPersonalizationNumberSides ({
   $PersonalizationProperties
}) {
    return Object
    .entries($PersonalizationProperties)
    .map(
        ([$Name, ]) => $Name.slice(0,5)
    )
    .filter(
        $PropertyName => $PropertyName.startsWith("Side")
    )
    .filter(
        (value, index, self) => self.indexOf(value) === index
    )
    .length
}

async function Get_TervisPersonalizationFormProperties () {
    var $SelectedLineItem = await Get_TervisShopifyPOSPersonalizableLineItemSelected()
    var {
        $ProductSize,
        $ProductFormType
    } = ConvertFrom_TervisShopifyPOSProductTitle ({ $ProductTitle: $SelectedLineItem.title })
    var $ProductMetadata = await Get_TervisProductMetaDataUsingIndex({$ProductSize, $ProductFormType})
    
    var $Properties = {}

    for (var $SideNumber of New_Range({$Start: 1, $Stop: $ProductMetadata.Personalization.MaximumSideCount})) {
        $Properties[`Side${$SideNumber}ColorName`] = Get_TervisPersonalizationSelectedColorName({$SideNumber})
        var $FontMetadata = Get_TervisPersonalizationSelectedFontMetadata({$SideNumber})
        $Properties[`Side${$SideNumber}FontName`] = $FontMetadata.Name

        if (!$FontMetadata.MonogramStyle) {
            for (var $LineNumber of New_Range({$Start: 1, $Stop: $ProductMetadata.Personalization.MaximumLineCount})) {
                var $ID = `Side${$SideNumber}Line${$LineNumber}`
                var $Value = Get_ElementPropertyValue({$PropertyName: "value", $QuerySelector: `#${$ID}`})
                if ($Value) {
                    $Properties[$ID] = $Value
                }
            }
        } else {
            var $ID = `Side${$SideNumber}Line1`
            var $Value = Get_ElementPropertyValue({$PropertyName: "value", $QuerySelector: `#${$ID}`})
            if ($Value) {
                $Properties[$ID] = $Value
            }
        }
    }
    return $Properties
}

function Get_TervisShopifyPOSPersonalizableLineItemAssociatedPersonalizationChargeLine ({
    $Cart,
    $PersonalizableLineItem
}) {
    var $PersonalizationChargeLineItems = $Cart.line_items
    .filter(
        $CartLineItem => {
            if ($CartLineItem.properties) { // remove once https://github.com/tc39/proposal-optional-chaining is live, next line should be $CartLineItem?.properties
                return $CartLineItem.properties
                    .filter( 
                        $Property =>
                        $Property.name === "RelatedLineItemSKU" &&
                        $Property.value === $PersonalizableLineItem.sku
                    )[0]
            }
        }
    )

    Add_PersonalizationChargeLineCustomProperties({
        $PersonalizationChargeLineItem: $PersonalizationChargeLineItems
    })

    return $PersonalizationChargeLineItems
}

function Add_PersonalizationChargeLineCustomProperties ({
    $PersonalizationChargeLineItem
}) {
    if ($PersonalizationChargeLineItem) {
        Add_MemberScriptProperty({
            $InputObject: $PersonalizationChargeLineItem,
            $Name: "PropertiesObject",
            $Value: function () { 
                return this.properties.reduce(
                    ($FinalReturnValue, $CurrentValue) =>
                    ($FinalReturnValue[$CurrentValue.name] = $CurrentValue.value, $FinalReturnValue),
                    {}
                )
            }
        })    
    }
}

// async function Get_TervisShopifyPOSLineItemPersonalizationProperties ({
//     $PersonalizableLineItem
// }) {
//     var $Cart = await Get_TervisShopifyCart()
//     var $PersonalizationChargeLineItems = Get_TervisShopifyPOSPersonalizableLineItemAssociatedPersonalizationChargeLine({
//         $Cart,
//         $PersonalizableLineItem
//     })
    
//     return $PersonalizationChargeLineItems.length > 0 ?
//         $PersonalizationChargeLineItems.map(
//             $PersonalizationChargeLineItem => {
//                 return Get_PersonalizationPropertiesFromPersonalizationChargeLineItem({$PersonalizationChargeLineItem})
//             }
//         ) :
//         undefined
// }

// function Get_PersonalizationPropertiesFromPersonalizationChargeLineItem ({
//     $PersonalizationChargeLineItem
// }) {
//     var $Properties = $PersonalizationChargeLineItem.properties
//     // https://stackoverflow.com/a/44325124/101679
//     .reduce(
//         ($FinalReturnValue, $CurrentValue) =>
//         ($FinalReturnValue[$CurrentValue.name] = $CurrentValue.value, $FinalReturnValue),
//         {}
//     )
//     $Properties.Quantity = $PersonalizationChargeLineItem.quantity
//     return $Properties
// }

// Replace with optional chaining once that has browser support https://github.com/tc39/proposal-optional-chaining
function Get_ElementPropertyValue ({
    $QuerySelector,
    $PropertyName
}) {
    var $Element = document.querySelector($QuerySelector)
    return $Element ?
    $Element[$PropertyName] :
    undefined
}

function Get_TervisPersonalizationSelectedFontName ({
    $SideNumber
}) {
    return Get_ElementPropertyValue({$QuerySelector: `[title='Side${$SideNumber}FontName']`, $PropertyName: "value"})
}

function Get_TervisPersonalizationSelectedColorName ({
    $SideNumber
}) {
    return Get_ElementPropertyValue({$QuerySelector: `[title='Side${$SideNumber}ColorName']`, $PropertyName: "value"})
}

function Get_TervisPersonalizationSelectedFontMetadata ({
    $PersonalizationChargeLineItem,
    $SideNumber
}) {
    var $FontName = $PersonalizationChargeLineItem ?
    $PersonalizationChargeLineItem.PropertiesObject[`Side${$SideNumber}FontName`] :
    Get_TervisPersonalizationSelectedFontName({$SideNumber})
    
    var $FontMetadata = $FontMetadataHashtable[$FontName]
    if ($FontMetadata) {
        $FontMetadata.Name = $FontName
        return $FontMetadata    
    }
}

var $FontMetadataHashtable = {
    "Script": {
        "MaximumCharactersPerLine": "13"
    },
    "Block U/L": {
        "MaximumCharactersPerLine": "13"
    },
    "Monogram": {
        "MonogramStyle": true,
        "AllCharactersRequired": true,
        "MaximumCharacters": "3"
    },
    "Initials Block": {
        "MonogramStyle": true,
        "MaximumCharacters": "3"
    },
    "Initials Script": {
        "MonogramStyle": true,
        "MaximumCharacters": "3"
    }
}

var $PersonalizationColors =  [ 
    "Black",
    "Chocolate",
    "Fuchsia",
    "Green",
    "Hunter",
    "Navy",
    "Orange",
    "Purple",
    "Red",
    "Royal Blue",
    "Turquoise",
    "White",
    "Yellow"
]

function New_InputText ({
    $ID,
    $Value,
    $PlaceHolder,
    $MaxLength,
    $MinLength,
    $Required,
    $Pattern,
    $Hidden,
    $OnChange
}) {
    return html`
    <input
        id=${ifDefined($ID)}
        .value=${ifDefined($Value)}
        type="text"
        maxlength=${ifDefined($MaxLength)}
        minlength=${ifDefined($MinLength)}
        ?required=${$Required}
        ?hidden=${$Hidden}
        pattern=${ifDefined($Pattern)}
        placeholder=${ifDefined($PlaceHolder)}
        @change=${$OnChange}
    />
    `
}

function New_TervisSelect ({
    $Title,
    $ID,
    $Options,
    $Required,
    $OnChange
}) {
    return html`
        <select
            id=${ifDefined($ID)}
            title=${ifDefined($Title)}
            ?required=${$Required}
            @change=${$OnChange}
        >
        <option selected disabled value="">${$Title}</option>
        ${
            $Options
            .map(
                $Option => 
                html`
                    <option 
                        .value=${ifDefined($Option.Value)}
                        ?selected=${$Option.Selected}
                    >${$Option.Text}</option>
                `
            )
        }
        </select>
    `
}

function Set_ContainerContent ({
    $TargetElementSelector,
    $Content
}) {
    var $Container = document.querySelector($TargetElementSelector)
    render(
        $Content,
        $Container
    )
}

function ConvertFrom_TervisShopifyPOSProductTitle ({
    $ProductTitle
}) {
    var [,$ProductFormType,,,$ProductSize] = $ProductTitle.split(".")
    return {$ProductSize, $ProductFormType}
}

const forceWrite = directive((value) => (part) => {
    part.setValue(value);
  });

main ()

// function getPersonalizeItConfig() {
//     return {
//         "restrictionUrl": "c:\\Program Files\\nChannel\\Personalize\\PersonalizationGuidelines.html",
//     };
// }