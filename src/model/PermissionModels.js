


export const AccessLevel = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    WRITE: 'WRITE',
    READ: 'READ',       // Только чтение
    DENIED: 'DENIED',   // Доступ запрещен
    NONE: 'NONE'        // Нет доступа
};


export class ProjectPermissionUpdateDto {
    constructor({ email, role, isExcluded = false }) {
        this.email = email;
        this.role = role;
        this.isExcluded = isExcluded;
    }
}


export class BoardPermissionUpdateDto {
    constructor({ email, role, isExcluded = false }) {
        this.email = email;
        this.role = role;
        this.isExcluded = isExcluded;
    }
}


export class ProjectParticipantDto {
    constructor({ userId, login, email, firstName, lastName, role, isOwner = false }) {
        this.userId = userId;
        this.login = login;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.isOwner = isOwner;
    }

    
    getDisplayName() {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        } else if (this.firstName) {
            return this.firstName;
        } else if (this.lastName) {
            return this.lastName;
        } else {
            return this.login || this.email || `Пользователь #${this.userId}`;
        }
    }
}


export class BoardParticipantDto {
    constructor({ userId, login, email, firstName, lastName, role, isOwner = false }) {
        this.userId = userId;
        this.login = login;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.isOwner = isOwner;
    }

    
    getDisplayName() {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        } else if (this.firstName) {
            return this.firstName;
        } else if (this.lastName) {
            return this.lastName;
        } else {
            return this.login || this.email || `Пользователь #${this.userId}`;
        }
    }
}


export class ProjectAccessDetailsDto {
    constructor({ accessLevel, isOwner = false, canCreate = false, canView = false, canEdit = false, canDelete = false, canManageRights = false }) {
        this.accessLevel = accessLevel;
        this.isOwner = isOwner;
        this.canCreate = canCreate;
        this.canView = canView;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
        this.canManageRights = canManageRights;
    }

    
    static fromAccessLevel(accessLevel, isOwner = false) {
        const dto = new ProjectAccessDetailsDto({
            accessLevel,
            isOwner
        });

        // Устанавливаем права в зависимости от уровня доступа
        switch (accessLevel) {
            case AccessLevel.OWNER:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = true;
                dto.canManageRights = true;
                break;
            case AccessLevel.ADMIN:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = true;
                dto.canManageRights = true;
                break;
            case AccessLevel.WRITE:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            case AccessLevel.READ:
                dto.canCreate = false;
                dto.canView = true;
                dto.canEdit = false;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            case AccessLevel.DENIED:
                dto.canCreate = false;
                dto.canView = false;
                dto.canEdit = false;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            default:
                break;
        }

        return dto;
    }
}


export class BoardAccessDetailsDto {
    constructor({ accessLevel, isOwner = false, canCreate = false, canView = false, canEdit = false, canDelete = false, canManageRights = false }) {
        this.accessLevel = accessLevel;
        this.isOwner = isOwner;
        this.canCreate = canCreate;
        this.canView = canView;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
        this.canManageRights = canManageRights;
    }

    
    static fromAccessLevel(accessLevel, isOwner = false) {
        const dto = new BoardAccessDetailsDto({
            accessLevel,
            isOwner
        });

        // Устанавливаем права в зависимости от уровня доступа
        switch (accessLevel) {
            case AccessLevel.OWNER:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = true;
                dto.canManageRights = true;
                break;
            case AccessLevel.ADMIN:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = true;
                dto.canManageRights = true;
                break;
            case AccessLevel.WRITE:
                dto.canCreate = true;
                dto.canView = true;
                dto.canEdit = true;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            case AccessLevel.READ:
                dto.canCreate = false;
                dto.canView = true;
                dto.canEdit = false;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            case AccessLevel.DENIED:
                dto.canCreate = false;
                dto.canView = false;
                dto.canEdit = false;
                dto.canDelete = false;
                dto.canManageRights = false;
                break;
            default:
                break;
        }

        return dto;
    }

    
    static fromBoardAccessDetails(boardAccessDetails) {
        return new BoardAccessDetailsDto({
            accessLevel: boardAccessDetails.accessLevel,
            isOwner: boardAccessDetails.isOwner,
            canCreate: boardAccessDetails.canCreate,
            canView: boardAccessDetails.canView,
            canEdit: boardAccessDetails.canEdit,
            canDelete: boardAccessDetails.canDelete,
            canManageRights: boardAccessDetails.canManageRights
        });
    }
} 